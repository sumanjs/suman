//core
const fs = require('fs');

//npm
const socketio = require('socket.io');
const chokidar = require('chokidar');
const _ = require('lodash');
const cp = require('child_process');
const path = require('path');

//project
const constants = require('../../config/suman-constants');
const runTranspile = require('../../lib/transpile/run-transpile');

//////////////////////////

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
	console.log('\n\n => Warning Suman exec could not be located, attempting $suman...');
	sumanExec = 'suman ';
}

function initiateTranspileAction(p, opts, executeTest) {

	const transpileThese = _.flatten([p]).filter(function (p) {
		return pathHash[p].transpile;
	});

	if(transpileThese.length < 1){
		return;
	}

	runTranspile(transpileThese, (opts || {}), function (err, results) {
		if (err) {
			console.log('transpile error:', err);
		}
		else {
			console.log('transpile results:', results);

			if (executeTest && String('check that it ends with .js')) {
				runTestWithSuman(results);
			}
		}
	});
}

function runTestWithSuman(tests){

	const cmd = sumanExec + ' ' + tests.join(' ');

	console.log('\n\n => Test will now be run with command:\n', cmd);

	cp.exec(cmd, function (err, stdout, stderr) {
		if (true || err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
			console.error(err.stack || err || stdout || stderr);
		}
	});

}

const pathHash = {};
var watcher;

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

			const paths = msg.paths;
			const transpile = msg.transpile || false;

			paths.forEach(function (p) {
				console.log('\np:',p);
				pathHash[String(p)] = {
					transpile: transpile
				};
			});
			
			console.log('watch has been received by server', msg);
			
			if (watcher) {
				console.log('\n\n => Watched paths before:', watcher.getWatched());
				watcher.add(paths);
				console.log('\n\n => Watched paths after:', watcher.getWatched());
			}
			else {
				console.log(' => chokidar watcher initialized.');
				watcher = chokidar.watch(paths, opts);
				
				var log = console.log.bind(console);

				watcher.on('add', p => {
					log(`File ${p} has been added`);
					initiateTranspileAction(p);
				});
				
				watcher.on('change', p => {
					log(`File ${p} has been changed`);

					console.log(pathHash[String(p)]);

					if(pathHash[p] && pathHash[p].transpile){
						console.log('transpiling!');
						initiateTranspileAction(p, null, true);
					}
					else{
						console.log('running!!');
						runTestWithSuman([p]);
					}
				});
				
				watcher.on('unlink', p => {
					log(`File ${p} has been removed`);
					initiateTranspileAction([], {all: true});
				});

				watcher.on('addDir', p => {
					log(`Directory ${p} has been added.`);
					initiateTranspileAction(p);
				});

				watcher.on('unlinkDir', p => {
					log(`Directory ${p} has been removed`);
					initiateTranspileAction([], {all: true});
				});

				watcher.on('error', error => {
					log(`chokidar watcher error: ${error}`)
				});

				watcher.on('ready', () => {
					log('Initial scan complete. Ready for changes');
					const watched = watcher.getWatched();
					console.log('Watched paths:', watched);
					(function(watched){
						Object.keys(watched).forEach(function(key){
							const array = watched[key];
							array.forEach(function(p){
								pathHash[p] = {
									transpile: transpile
								}
							});

						});
					})(watched);

				});

				watcher.on('raw', (event, p, details) => {
					if(['.log','.txt'].indexOf(path.extname(p)) < 0){
						log('\n\nRaw event info:', event, p, details, '\n\n');
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