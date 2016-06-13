/*

 README: the Suman server allows socketio client connections - when a watch message is sent to the server,
 we will begin watching the files requested to be watched - upon a file change (the developer saves changes to a test file)
 we most likely will transpile/run that file, by sending a message to the Poolio process pool with the filepath
 of the test file that changed. When the file changes, we first truncate the test-stdout.log file, then all other writing
 operations to that file are append operations.

 */


//core
const fs = require('fs');

//npm
const socketio = require('socket.io');
const chokidar = require('chokidar');
const _ = require('lodash');
const cp = require('child_process');
const path = require('path');
const Pool = require('poolio');

//project
const constants = require('../../config/suman-constants');
const runTranspile = require('../../lib/transpile/run-transpile');

//////////////////////////////////////////////////

const watcherOutputLogPath = path.resolve(global.sumanHelperDirRoot + '/logs/watcher-output.log');

function getStream() {
	return fs.createWriteStream(watcherOutputLogPath, {
		flags: 'a',
		flag: 'a'
	});
}

//note: if stdout and stderr share the same writable stream maybe their output will be in the right order?

const workerPath = path.resolve(__dirname, '..', '..', 'lib/suman-watch-worker.js');

const pool = new Pool({
	size: 3,
	addWorkerOnExit: true,
	silent: true,
	filePath: workerPath,
	stdout: getStream,
	stderr: getStream,
	env: _.extend(process.env, {
		SUMAN_WATCH: 'yes'
	})
});

///////////////////////////////////////////////////

const opts = {
	ignored: ['**/*.txt', '**/*.log'],
	ignoreInitial: true
	// ignored: /(\.txt|\.log)$/
};

var sumanExec;

try {
	sumanExec = require.resolve('suman');
	const temp = String(sumanExec).split(path.sep);
	temp.pop();
	temp.pop();
	temp.push('index.js');
	sumanExec = 'node ' + path.resolve(temp.join(path.sep));
}
catch (err) {
	console.log('\n\n\t => Warning Suman main executable file could not be located, attempting "$ suman"...');
	sumanExec = 'suman ';
}

function initiateTranspileAction(p, opts, executeTest) {

	const transpileThese = _.flatten([p]).filter(function (p) {
		return pathHash[p].transpile;
	});

	if (transpileThese.length < 1) {
		return;
	}

	fs.writeFileSync(watcherOutputLogPath,
		'\n\n => file will first be transpiled/copied.', {
			flags: 'a',
			flag: 'a'
		});

	runTranspile(transpileThese, (opts || {}), function (err, results) {
		if (err) {
			console.log('transpile error:', err);

			fs.writeFileSync(watcherOutputLogPath,
				'\n\n => file transpilation error => \n' + err.stack, {
					flags: 'a',
					flag: 'a'
				});
		}
		else {
			console.log(' => transpile results:', results);

			fs.writeFileSync(watcherOutputLogPath,
				'\n => file transpiled successfully.', {
					flags: 'a',
					flag: 'a'
				});

			//TODO: check that changed file is a .js file etc
			if (executeTest) {
				runTestWithSuman(results);
			}
		}
	});
}

const match = global.sumanMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));
const notMatch = global.sumanNotMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));

console.log('sumanMatches:', match);
console.log('sumanNotMatches:', notMatch);

function matchesInput(filename) {
	return match.every(function (regex) {
		return !String(filename).match(regex);
	});
}

function doesNotMatchNegativeMatchInput(filename) {
	return notMatch.every(function (regex) {
		return !String(filename).match(regex);
	});
}

function runTestWithSuman($tests) {

	var logExtraMsg = false;

	const tests = $tests.filter(function (item) {
		const _matchesInput = matchesInput(item);
		const _doesNotMatch = doesNotMatchNegativeMatchInput(item);
		console.log('item:', item);
		console.log('_matchesInput:', _matchesInput);
		console.log('_doesNotMatch:', _doesNotMatch);
		const condition = _matchesInput && _doesNotMatch;
		if (!condition) {
			logExtraMsg = true;
			const msg = ' => Suman server message => the following file changed and may have been transpiled,\n' +
				'\t but it did not match the regular expressions necessary to run the test =>\n\t => ' + item;

			console.log(msg);
			fs.writeFileSync(watcherOutputLogPath,
				'\n' + msg, {
					flags: 'a',
					flag: 'a'
				});
		}
		return condition;
	});

	if (logExtraMsg) {
		const msg1 = ' => Regexes that effect the execution of a test:\n' +
			'positive matches: ' + global.sumanMatches + '\n' +
			'negative matches: ' + global.sumanNotMatches;
		console.log(msg1);
		fs.writeFileSync(watcherOutputLogPath,
			'\n' + msg1, {
				flags: 'a',
				flag: 'a'
			});
	}
	
	if (tests.length < 1) {
		const msg2 = ' Not test files matched regexes, nothing to run. We are done here.';
		console.log(msg2);
		fs.writeFileSync(watcherOutputLogPath,
			'\n' + msg2, {
				flags: 'a',
				flag: 'a'
			});
		return;
	}

	const cmd = sumanExec + ' ' + tests.join(' ');

	console.log('\n\n => Test will now be run with command:\n', cmd);

	fs.writeFileSync(watcherOutputLogPath,
		'\n => test will now execute.\n\n', {
			flags: 'a',
			flag: 'a'
		});

	if(process.env.SUMAN_DEBUG === 'yes'){
		fs.writeFileSync(watcherOutputLogPath,
			'\n => pool size => ' + JSON.stringify(pool.getCurrentSize()) + '\n', {
				flags: 'a',
				flag: 'a'
			});
	}


	//note: we want to kill all suman workers that are
	//currently running tests and writing to the watcher-output.log file
	pool.killAllActiveWorkers();

	const promises = tests.map(function (t) {
		return pool.any({testPath: t});
	});

	Promise.all(promises).then(function (val) {
		console.log('Pool response:', val);
	}, function (e) {
		console.error(e.stack || e);
	});

}

const pathHash = {};
var watcher;

//TODO: look out for for memory leaks here
module.exports = function (server) {

	const io = socketio(server);

	io.sockets.on('connection', function (socket) {

		console.log('\n', 'Client connected.', '\n');

		socket.emit('message', 'listening');

		socket.on('disconnect', function () {
			console.log('\nClient disconnected.\n');
		});

		//TODO: need to add hash, that shows whether files need to be transpiled or not

		socket.on('watch', function ($msg) {

			const msg = JSON.parse($msg);

			const paths = msg.paths.map(function (p) {
				return String(p).replace('___jb_tmp___', '').replace('___jb_old___', ''); //JetBrains support
			});
			const transpile = msg.transpile || false;

			console.log(' => Suman server event => socketio watch event has been received by server:\n', msg);

			if (watcher) {
				console.log('\n\n => Watched paths before:', watcher.getWatched());
				watcher.add(paths);
				console.log('\n\n => Watched paths after:', watcher.getWatched());
			}
			else {
				console.log(' => chokidar watcher initialized.');
				watcher = chokidar.watch(paths, opts);

				watcher.on('add', p => {
					p = String(p).replace('___jb_tmp___', '').replace('___jb_old___', ''); //JetBrains support
					console.log(`File ${p} has been added`);
					initiateTranspileAction(p);
				});

				watcher.on('change', p => {

					console.log(`File ${p} has been changed`);

					p = String(p).replace('___jb_tmp___', '').replace('___jb_old___', ''); //for Webstorm support

					console.log(pathHash[String(p)]);

					if (!pathHash[p]) {
						console.log(' => Suman server warning => the following file path was not already stored in the pathHash:', p);
					}

					fs.writeFileSync(watcherOutputLogPath,  //'w' flag truncates the file, the only time the file is truncated
						'\n\n => Suman watcher => file changed:\n' + p, {
							flags: 'w',
							flag: 'w'
						});

					if (pathHash[p] && pathHash[p].transpile) {
						console.log('transpiling!');
						initiateTranspileAction(p, null, true);
					}
					else {
						console.log('running!!');
						runTestWithSuman([p]);
					}
				});

				watcher.on('unlink', p => {
					console.log(`File ${p} has been removed`);
					initiateTranspileAction([], {all: true});
				});

				watcher.on('addDir', p => {
					console.log(`Directory ${p} has been added.`);
					initiateTranspileAction(p);
				});

				watcher.on('unlinkDir', p => {
					console.log(`Directory ${p} has been removed`);
					initiateTranspileAction([], {all: true});
				});

				watcher.on('error', error => {
					console.log(`chokidar watcher error: ${error}`)
				});

				watcher.on('ready', () => {
					console.log('Initial scan complete. Ready for changes');
					const watched = watcher.getWatched();
					console.log('Watched paths:', watched);

					(function (w) {
						Object.keys(w).forEach(function (key) {
							const array = w[key];
							array.forEach(function (p) {
								const temp = path.resolve(key + '/' + p);
								console.log(' => The following file path is being saved as { transpile:', transpile, '} =>', temp);
								pathHash[temp] = {
									transpile: transpile
								}
							});

						});
					})(watched);

				});

				watcher.on('raw', (event, p, details) => {
					if (['.log', '.txt'].indexOf(path.extname(p)) < 0) {
						console.log('\n\nRaw event info:', event, p, details, '\n\n');
					}

				});
			}

		});

		socket.on('TEST_DATA', function (data) {

			try {
				var json = JSON.stringify(data.test);

				if (data.outputPath) {

					//TODO: this functionality needs to mirror writing to disk in suman test runner etc

					console.log('TEST_DATA received - data.outputPath:', data.outputPath);

					process.nextTick(function () {
						socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
					});

					// fs.appendFile(data.outputPath, json += ',', function (err) {
					//     if (err) {
					//         console.error(err.stack);
					//         socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
					//     }
					//     else {
					//         //req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
					//         socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
					//     }
					// });
				}
				else {
					console.error(new Error('no output p for test data: ' + JSON.stringify(data)).stack);
				}
			}
			catch (err) {
				console.error(err.stack);
				socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
			}

		});

	});

};