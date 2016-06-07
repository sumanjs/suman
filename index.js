#!/usr/bin/env node --harmony

/////////////////////////////////////////////////////////////////

// if (require.main !== module || process.argv.indexOf('--suman') > -1) {
//     //prevents users from f*king up by accident and getting in some possible infinite process.spawn loop that will lock up their system
//     //most likely protects the very unlikely case that suman runs itself, which would cause mad infinite proces spawns
//     console.log('Warning: attempted to require Suman index.js but this cannot be.');
//     return;
// }

// var sigintCount = 0;
//
// process.on('SIGINT', () => {
// 	console.log('Suman got your SIGINT => Press Control-C *twice* to exit.');
// 	sigintCount++;
// 	if (sigintCount > 1) {
// 		process.exit(130);
// 	}
// });

/////////////////////////////////////////////////////////////////

process.on('uncaughtException', function (err) {
	console.error('\n\n => Suman uncaught exception =>\n', err.stack, '\n\n');
	process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

const fs = require('fs');
const path = require('path');
const os = require('os');
const domain = require('domain');
const cp = require('child_process');
const vm = require('vm');
const assert = require('assert');
const EE = require('events');

//#npm
const dashdash = require('dashdash');
const colors = require('colors/safe');
const async = require('async');
const _ = require('lodash');
// const requireFromString = require('require-from-string');

//#project
const constants = require('./config/suman-constants');
const runTranspile = require('./lib/transpile/run-transpile');

////////////////////////////////////////////////////////////////////

const pkgJSON = require('./package.json');
const v = pkgJSON.version;
console.log(colors.yellow.italic(' => Suman v' + v + ' running...'));

////////////////////////////////////////////////////////////////////

const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

//#project
const sumanUtils = require('./lib/utils');
const suman = require('./lib');
const root = sumanUtils.findProjectRoot(cwd);
const makeNetworkLog = require('./lib/make-network-log');
const findSumanServer = require('./lib/find-suman-server');

if (!root) {
	console.log(' => Warning => A Node.js project root could not be found given your current working directory.');
	console.log(colors.bgRed.white(' => cwd:', cwd, ' '));
	console.log(' => Please execute the suman command from within the root of your project.\n\n');
	return;
}

if (cwd !== root) {
	console.log(' => CWD:', cwd);
	console.log(' => Project root:', root);
}

global.projectRoot = root;

////////////////////////////////////////////////////////////////////

const opts = require('./lib/parse-cmd-line-opts/parse-opts');

////////////////////////////////////////////////////////////////////

global.viaSuman = true;
global.resultBroadcaster = new EE();

/////////////////////////////////////////////////////////////////////

function requireFromString(src, filename) {   //note: this is for piping tests through Suman, if ever necessary
	var Module = module.constructor;
	var m = new Module();
	m.filename = '/Users/denmanm1/WebstormProjects/oresoftware/suman/test/build-tests/test6.test.js';
	m.paths = ['/Users/denmanm1/WebstormProjects/oresoftware/suman/test/build-tests'];
	m._compile(src, filename);
	return m.exports;
}

//////////////////////////////////////////////////////////////////////

var sumanConfig, pth;

//TODO: use harmony destructuring args later on
const configPath = opts.config;
const serverName = opts.server_name;
const convert = opts.convert;
const src = opts.src;
const dest = opts.dest;
const init = opts.init;
const initBabel = opts.init_babel;
const uninstall = opts.uninstall;
const force = opts.force;
const fforce = opts.fforce;
const s = opts.server;
const useRunner = opts.runner;
const grepFile = opts.grep_file;
const grepFileBaseName = opts.grep_file_base_name;
const grepSuite = opts.grep_suite;
const coverage = opts.coverage;
const tailRunner = opts.tail_runner;
const tailTest = opts.tail_test;
const useBabel = opts.use_babel;

var transpile = opts.transpile;

var sumanInstalledLocally = null;

if (!init) {
	var err;

	try {
		require.resolve(root + '/node_modules/suman');
		sumanInstalledLocally = true;
	} catch (e) {
		err = e;
	}
	finally {
		if (err) {
			sumanInstalledLocally = false;
			console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed locally, you may wish to run "$ suman --init"'));
		}
		else {
			if (false) {  //only if user asks for verbose option
				console.log(' ' + colors.yellow('=> Suman message => Suman appears to be installed locally.'));
			}
		}
	}
}

var targetTestDir;

if (transpile) {
	targetTestDir = path.resolve(root + '/test-target');
}

if (init) {
	sumanConfig = require(__dirname + '/default-conf-files/suman.default.conf');
}
else {
	try {
		//TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test

		pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
		sumanConfig = require(pth);
		if (opts.verbose) {  //default to true
			console.log('\t => Suman config used: ' + pth);
		}

	}
	catch (err) {

		//TODO: try to get suman.conf.js from root of project

		if (!init) {
			console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file in your current working directory or given by --cfg at the command line...'));
			console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ...now looking for a config file at the root of your project...'));
		}

		try {
			pth = path.resolve(root + '/' + 'suman.conf.js');
			sumanConfig = require(pth);
			if (!opts.sparse) {  //default to true
				console.log(colors.cyan(' => Suman XY config used: ' + pth + '\n'));
			}
		}
		catch (err) {
			console.log(colors.bgCyan.white(' => Suman message => Warning - no configuration found in your project, using default Suman configuration.'));
			try {
				pth = path.resolve(__dirname + '/default-conf-files/suman.default.conf.js');
				sumanConfig = require(pth);
			}
			catch (err) {
				console.error('\n => ' + err + '\n');
				return;
			}
		}
	}
}

global.sumanConfig = sumanConfig;
global.maxProcs = global.sumanOpts.concurrency || sumanConfig.maxParallelProcesses || 15;
global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

//////////////////// abort if too many top-level options /////////////////////////////////////////////

const optCheck = [useBabel, init, uninstall, convert, s, tailTest, tailRunner].filter(function (item) {
	return item;
});

if (optCheck.length > 1) {
	console.error('\tTwo many options, pick one from  { --convert, --init, --server, --use-babel, --uninstall --tail-test, --tail-runner }');
	console.error('\tUse --help for more information.\n');
	console.error('\tUse --examples to see command line examples for using Suman in the intended manner.\n');
	process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
	return;
}

////////////////// merge cmd line options with config file //////////////////////////////////////////

if (!opts.no_transpile && global.sumanConfig.transpile === true) {
	transpile = opts.transpile = true;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

global.sumanReporters = [].concat((opts.reporter_paths || []).map(function (item) {
	if (!path.isAbsolute(item)) {
		item = path.resolve(root + '/' + item);
	}
	const fn = require(item);
	assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
	fn.pathToReporter = item;
	return fn;
}));

if (opts.reporters && !sumanConfig.reporters) {
	throw new Error(' => Suman fatal error => You provided reporter names but have no reporters object in your suman.conf.js file.');
}

const reporterKV = sumanConfig.reporters || {};

(opts.reporters || []).forEach(function (item) {

	//TODO: check to see if paths of reporter paths clashes with paths from reporter names at command line (unlikely)
	var val = reporterKV[item];
	if (!val) {
		throw new Error(' => Suman fatal error => no reporter with name = "' + item + '" in your suman.conf.js file.');
	}
	else {
		if (!path.isAbsolute(val)) {
			val = path.resolve(root + '/' + val);
		}
		const fn = require(val);
		assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + val + '"');
		fn.pathToReporter = val;
		global.sumanReporters.push(fn);
	}

});

if (global.sumanReporters.length < 1) {
	const fn = require(path.resolve(__dirname + '/lib/reporters/std-reporter'));
	assert(typeof fn === 'function', 'Native reporter fail.');
	global.sumanReporters.push(fn);
}

global.sumanReporters.forEach(function (reporter) {
	reporter.apply(global, [global.resultBroadcaster]);
});

//note: whatever args are remaining are assumed to be file or directory paths to tests
var paths = JSON.parse(JSON.stringify(opts._args)).filter(function (item) {
	if (String(item).indexOf('-') === 0) {
		console.log(colors.magenta(' => Suman warning => Probably a bad command line option "' + item + '", Suman is ignoring it.'))
		return false;
	}
	return true;
});

if (opts.verbose) {
	console.log(' => Suman verbose message => arguments assumed to be file paths to run:', paths);
}

/////////////////// assign vals from config ////////////////////////////////////////////////

//TODO possibly reconcile these with cmd line options
const testDir = global._sTestDir = path.resolve(root + '/' + global.sumanConfig.testDir);
const testSrcDir = global._sTestSrcDir = path.resolve(root + '/' + global.sumanConfig.testSrcDir);
const testDestDir = global._sTestDestDir = path.resolve(root + '/' + global.sumanConfig.testDestDir);
const testDirCopyDir = global._sTestDirCopyDir = path.resolve(root + '/' + (global.sumanConfig.testDirCopyDir || 'test-target'));

////////////////////////////////////////////////////////////////////////////////////////////

if (tailRunner) {
	require('./lib/make-tail/tail-runner');
}
else if (tailTest) {
	require('./lib/make-tail/tail-test');
}
else if (useBabel) {

	require('./lib/use-babel/use-babel')(null, function (err, stdout, stderr) {
		if (err) {
			console.log('\n', 'Babel was not installed successfully globally.');
			console.log('\n', stdout);
			console.log('\n', stderr);
		}
		else {
			console.log('\n', 'Babel was not installed successfully globally.');
		}

	});

}
else if (init) {

	require('./lib/init/init-project')({
		force: force,
		fforce: fforce
	});

}
else if (uninstall) {
	require('./lib/uninstall/uninstall-suman')({
		force: force,
		fforce: fforce
	});

}
else if (convert) {

	if (!src || !dest) {
		console.log('Please designate a src dir and dest dir for the conversion from Mocha test(s) to Suman test(s).');
		console.log('The correct command is: suman --convert --src=[file/dir] --dest=[dir]');
		return;
	}

	var err = null;

	try {
		require(path.resolve(root + '/' + dest));
	}
	catch (e) {
		err = e;
	}

	if (!force && !err) {
		console.log('Are you sure you want to overwrite contents within the folder with path="' + path.resolve(root + '/' + dest) + '" ?');
		console.log('If you are sure, try the same command with the -f option.');
		console.log('Before running --force, it\'s a good idea to run a commit with whatever source control system you are using.');
		return;
	}

	require('./lib/convert-files/convert-dir')({
		src: src,
		dest: dest
	});

} else if (s) {

	suman.Server({
		//configPath: 'suman.conf.js',
		config: sumanConfig,
		serverName: serverName || os.hostname()
	}).on('msg', function (msg) {
		switch (msg) {
			case 'listening':
				console.log('Suman server is listening on localhost:6969');
				// process.exit();
				break;
			default:
				console.log(msg);
		}
	}).on('SUMAN_SERVER_MSG', function (msg) {
		switch (msg) {
			case 'listening':
				console.log('Suman server is listening on localhost:6969');
				// process.exit();
				break;
			default:
				console.log(msg);
		}
	});

}
else {

	console.log('\n');

	const timestamp = global.timestamp = Date.now();
	const networkLog = global.networkLog = makeNetworkLog(timestamp);
	const server = global.server = findSumanServer(null);

	function checkStatsIsFile(item) {
		try {
			return fs.statSync(item).isFile();
		}
		catch (err) {
			if (opts.verbose) {
				console.error(' => Suman verbose warning => ', err.stack);
			}
			return null;
		}
	}

	async.series({

		npmList: function (cb) {
			// cp.exec('npm list -g', cb);
			process.nextTick(cb);
		},

		transpileFiles: function (cb) {

			if (transpile) {
				runTranspile(paths, opts, cb);
			}
			else {
				process.nextTick(cb);
			}
		},
		watchFiles: function (cb) {
			if (global.sumanOpts.watch) {
				require('./lib/watching/add-watcher')(paths, cb);
			}
			else {
				process.nextTick(cb);
			}

		},
		conductStaticAnalysisOfFilesForSafety: function (cb) {
			if (global.sumanOpts.safe) {
				cb(new Error('safe option not yet implemented'));
			}
			else {
				process.nextTick(cb);
			}
		},
		acquireLock: function (cb) {
			networkLog.createNewTestRun(server, cb);
		}

	}, function (err, results) {

		if (err) {
			console.log('\n\n => Suman fatal problem => ' + (err.stack || err),'\n\n');
			return;
		}

		if (opts.no_run) {
			console.log('\n\n\t => Suman message => the ' + colors.magenta('--no-run') + ' option is set, we are done here for now.');
			console.log('\t To view the options and values that will be used to initiate a Suman test run, use the --verbose or --vverbose options\n\n');
			// if(opts.watch){
			// 	console.log(' => Warning: --watch option is enabled so please close process manually.');
			// }
			return process.exit(0);
		}

		if (opts.vverbose) {
			console.log('=> Suman vverbose message => "$ npm list -g" results: ', results.npmList);
		}

		const d = domain.create();

		d.once('error', function (err) {
			//TODO: add link showing how to set up Babel
			console.error(colors.magenta(' => Suman fatal error => ' + err.stack + '\n'));
			process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
		});

		var originalPaths = null;

		if (transpile) {

			originalPaths = _.flatten(paths).map(function (item) {
				return path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));
			});

			if (opts.all) {
				opts.recursive = true;
				paths = [testDirCopyDir];
			}
			else if (opts.sameDir) {
				opts.recursive = true;
				paths = [testDestDir];
			}
			else {
				paths = results.transpileFiles;
			}

		}
		else {

			if (paths.length < 1) {
				if (opts.sameDir) {
					paths = [testSrcDir];
				}
				else if (testDir) {
					paths = [testDir];
				}
				else {
					throw new Error('No testDir prop specified.');
				}
			}
		}

		if (paths.length < 1) {
			console.error('\n\t' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
			console.error('\n   ' + colors.bgYellow.black(' => And, importantly, no testDir property is present in your suman.conf.js file. ') + '\n\n');
			process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
		}
		else {

			paths = paths.map(function (item) {
				return path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));
			});

			if (opts.verbose) {
				console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => Suman will execute test files from the following locations:'), '\n', paths, '\n');
			}

			//TODO: if only one file is used with the runner, then there is no possible blocking, so we can ignore the suman.order.js file,
			// and pretend it does not exist.

			if (coverage) {

				var istanbulInstallPath;
				try {
					istanbulInstallPath = require.resolve('istanbul');
					if (opts.verbose) {
						console.log(' => Suman verbose message => install path of instabul => ', istanbulInstallPath);
					}

				}
				catch (e) {
					if (!opts.force) {
						console.log('\n', ' => Suman message => Looks like istanbul is not installed globally, you can run "$ suman --use-istanbul", to acquire the right deps.');
						console.log('\n', ' => Suman message => If installing "istanbul" manually, you may install locally or globally, Suman will pick it up either way.');
						console.log('\t => To override this, use --force.', '\n');
						return;
					}
				}

				require('./lib/run-coverage/exec-istanbul')(istanbulInstallPath, paths, opts.recursive);

			}

			else if (!useRunner && transpile && opts.all && originalPaths.length === 1 && checkStatsIsFile(originalPaths[0])) {

				//TODO: need to learn how many files matched

				d.run(function () {
					process.nextTick(function () {
						process.chdir(path.dirname(paths[0]));  //force CWD to test file path // boop boop
						require('./lib/run-child-not-runner')(paths[0]);
					});
				});

			}
			else if (!useRunner && transpile && !opts.all && originalPaths.length === 1 && checkStatsIsFile(originalPaths[0])) {

				d.run(function () {
					process.nextTick(function () {
						process.chdir(path.dirname(paths[0]));  //force CWD to test file path // boop boop
						require('./lib/run-child-not-runner')(paths[0]);
					});
				});

			}
			else if (!useRunner && paths.length === 1 && checkStatsIsFile(paths[0])) {

				//TODO: we could read file in (fs.createReadStream) and see if suman is referenced

				d.run(function () {
					process.nextTick(function () {
						process.chdir(path.dirname(paths[0]));  //force CWD to test file path // boop boop
						//note: if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
						require('./lib/run-child-not-runner')(paths[0]);
					});
				});
			}
			else {
				d.run(function () {
					process.nextTick(function () {
						suman.Runner({
							grepSuite: grepSuite,
							grepFile: grepFile,
							$node_env: process.env.NODE_ENV,
							fileOrDir: paths
							//configPath: configPath || 'suman.conf.js'
						}).on('message', function (msg) {
							console.log('msg from suman runner', msg);
							//process.exit(msg);
						});
					});
				});
			}
		}

	});

}
