/**
 * Created by Olegzandr on 5/26/16.
 */


//core
const http = require('http');
const path = require('path');
const cp = require('child_process');

//npm
const colors = require('colors/safe');

//project
const suman = require('../index');

function watch(paths, cb) {

	const opts = global.sumanOpts;
	const testDir = global._sTestDir;
	const testSrcDir = global._sTestSrcDir;
	const testDestDir = global._sTestDestDir;
	const testDirCopyDir = global._sTestDirCopyDir;
	const root = String(global.projectRoot);

	const targetDir = path.resolve(root + '/' + (testDirCopyDir ? testDirCopyDir : (testDir + '-target')));

	if (global.sumanOpts.verbose) {
		console.log('\n\t' + colors.magenta('--watch option set to true'));
	}

	if (!global.sumanOpts.sparse && global.sumanOpts.all) {
		console.log('\n\t' + colors.bgMagenta(' => --watch option set to true => background watcher process will be started that will'));
		console.log('\t' + colors.bgMagenta(' listen for changes to any file in your ' + colors.bgYellow(' "' + testDir + '" ') + ' directory and will be'));
		console.log('\t' + colors.bgMagenta(' transpiled to  ' + colors.bgYellow(' "' + targetDir + '" ')));
	}

	// cp.fork(path.resolve(__dirname + '/watch-transpile'), [], {
	// 	detached: true,
	// 	stdio: ['ignore']
	// }).unref();

	// const p = path.resolve(global.sumanHelperDirRoot + '/logs/watch-stdout-stderr.log');
	//
	// const n = cp.spawn('node', ['lib/transpile/watch-transpile.js'], {
	// 	detached: true,
	// 	stdio: ['ignore', fs.openSync(p, 'w'), fs.openSync(p, 'w')]
	// });

	// n.stderr.setEncoding('utf-8');
	// n.stdout.setEncoding('utf-8');
	//
	// n.stderr.on('data', function (d) {
	// 	console.error(d);
	// });
	//
	// n.stdout.on('data', function (d) {
	// 	console.error(d);
	// });

	// const p = path.resolve(global.projectRoot + '/lib/transpile/watch-transpile');
	//
	// cp.exec('node ' + p, function (err, stdout, stderr) {
	//
	// 	if (err) {
	// 		console.error(err.stack);
	// 	}
	//
	// 	if (stderr) {
	// 		console.error(stderr);
	// 	}
	//
	// 	if (String(stdout).match(/error/i)) {
	// 		console.error(stdout);
	// 	}
	// });

	if(opts.all){
		// paths = [path.resolve(root + '/' + testDir) + '/**/*.js']
		paths = [testDir]
	}
	else {
		if(paths.length < 1){
			throw new Error('No paths arguments passed for watching.');
		}
		paths = paths.map(function (p) {
			return path.resolve(path.isAbsolute(p) ? p : (root + '/' + p));
		});
	}


	if (opts.verbose) {
		console.log('Suman will send the following paths to Suman server watch process:', paths);
	}

	var first = true;

	suman.Server({

		//TODO: force localhost here!

	}).on('connect', function () {

		console.log('Web-socket connection to Suman server successful.');
		this.emit('watch', JSON.stringify({
			paths: paths
		}));

	}).on('connect_timeout', function () {

		console.log(' => Suman server connection timeout :(');

	}).on('connect_error', function (err) {

		if (first) {
			first = false;
			if (!String(err.message).match(/xhr poll error/i)) {
				console.log(' => Suman server connection error: ' + err.stack);
			}
		}
		else {
			console.log(' => Suman server connection error: ' + err.stack);
		}
		
	});

	process.nextTick(cb);
	
}

module.exports = watch;