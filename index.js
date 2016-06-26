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
	if (String(err.stack || err).match(/Cannot find module/i) && global.sumanOpts && global.sumanOpts.transpile) {
		console.log(' => If transpiling, you may need to transpile your entire test directory to the destination directory using the ' +
			'--transpile and --all options together.')
	}
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
const util = require('util');

//#npm
const semver = require('semver');
const dashdash = require('dashdash');
const colors = require('colors/safe');
const async = require('async');
const _ = require('lodash');
// const requireFromString = require('require-from-string');

//#project
const constants = require('./config/suman-constants');
const sumanUtils = require('./lib/utils');

////////////////////////////////////////////////////////////////////

if (process.env.SUMAN_DEBUG === 'yes') {
	console.log(' => Suman started with the following command:', '\n', process.argv);
}

/*
 
 TODO
 
 may cause problems:
 
 => Suman started with the following command:
 [ '/Users/amills/.nvm/versions/node/v4.4.5/bin/node',
 '/Users/amills/.nvm/versions/node/v4.4.5/bin/suman',
 'service_proxifier_test.js' ]
 
 whereas this is ok:
 
 => Suman started with the following command:
 [ '/Users/amills/.nvm/versions/node/v4.4.5/bin/node',
 '/Users/amills/.nvm/versions/node/v4.4.5/bin/suman',
 '/Users/amills/WebstormProjects/vmware/wem_server2/test-suman/mocha/wem/actors/registry_loader_test.js' ]
 
 
 */

////////////////////////////////////////////////////////////////////

const nodeVersion = process.version;
const oldestSupported = constants.OLDEST_SUPPORTED_NODE_VERSION;

if (semver.lt(nodeVersion, oldestSupported)) {
	console.log(colors.red(' => Suman warning => Suman is not well-tested against Node versions prior to ' +
		oldestSupported + ', your version: ' + nodeVersion));
}

////////////////////////////////////////////////////////////////////

const pkgJSON = require('./package.json');
const v = pkgJSON.version;
console.log(colors.yellow.italic(' => Suman v' + v + ' running...'));

////////////////////////////////////////////////////////////////////

const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

//#project
const suman = require('./lib');
const root = global.projectRoot = process.env.SUMAN_PROJECT_ROOT = sumanUtils.findProjectRoot(cwd);
const makeNetworkLog = require('./lib/make-network-log');
const findSumanServer = require('./lib/find-suman-server');

if (!root) {
	console.log(' => Warning => A Node.js project root could not be found given your current working directory.');
	console.log(colors.bgRed.white.bold(' => cwd:', cwd, ' '));
	console.log(' => Please execute the suman command from within the root of your project.\n\n');
	return;
}

////////////////////////////////////////////////////////////////////

const opts = require('./lib/parse-cmd-line-opts/parse-opts');

if (global.sumanOpts.verbose) {
	console.log(' => Suman verbose message => Project root:', root);
}

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
const tail = opts.tail;

//re-assignable
var register = opts.register;
var transpile = opts.transpile;
var originalTranspileOption = opts.transpile;
var sumanInstalledLocally = null;
var sumanInstalledAtAll = null;
var sumanServerInstalled = null;
var err3;

if (cwd !== root) {
	if (!opts.vsparse) {
		console.log(' => CWD is not equal to project root:', cwd);
		console.log(' => Project root:', root);
	}
}
else {
	if (!opts.sparse) {
		console.log(colors.cyan(' => cwd:', cwd));
	}
}

if (!init) {
	var err1, err2;
	
	try {
		require.resolve(root + '/node_modules/suman');
		sumanInstalledLocally = true;
	} catch (e) {
		err1 = e;
	}
	finally {
		if (err1) {
			sumanInstalledLocally = false;
			if (!opts.sparse) {
				console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed locally, you may wish to run "$ suman --init"'));
			}
		}
		else {
			if (false) {  //only if user asks for verbose option
				console.log(' ' + colors.yellow('=> Suman message => Suman appears to be installed locally.'));
			}
		}
	}

	try {
		require.resolve('suman');
		sumanInstalledAtAll = true;
	} catch (e) {
		err1 = e;
	}
	finally {
		if (err1) {
			sumanInstalledAtAll = false;
			if (!opts.sparse || true) {
				console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed at all, you may wish to run "$ suman --init"'));
			}
		}
		else {
			if (opts.verbose) {  //only if user asks for verbose option
				console.log(' ' + colors.yellow('=> Suman message => Suman appears to be installed locally.'));
			}
		}
	}

	try {
		require.resolve('suman-server');
		sumanServerInstalled = true;
	}
	catch (err) {
		err3 = err;
		sumanServerInstalled = false;
		if (!opts.sparse) {
			console.log(' ' + colors.yellow('=> Suman message => note that Suman server is not installed.'));
		}
	}

}

if (opts.version) {
	console.log('...And we\'re done here.', '\n');
	return;
}

if (opts.testing) {
	require('./lib/testing');
	return;
}

//////////////// check for cmd line contradictions ///////////////////////////////////

if (opts.transpile && opts.no_transpile) {
	console.log('\n', ' => Suman fatal problem => --transpile and --no-transpile options with both set, please choose one only.');
	return;
}

if (opts.watch && opts.stop_watching) {
	console.log('\n', ' => Suman fatal problem => --watch and --stop-watching options with both set, please choose one only.');
	return;
}

////////////////////////////////////////////////////////////////////////////////////

var targetTestDir;

if (transpile) {
	targetTestDir = path.resolve(root + '/test-target');
}

if (init) {
	global.usingDefaultConfig = true;
	sumanConfig = require(__dirname + '/default-conf-files/suman.default.conf');
}
else {
	try {
		//TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
		
		pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
		sumanConfig = require(pth);
		if (opts.verbose) {  //default to true
			console.log(' => Suman verbose message => Suman config used: ' + pth);
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
				console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
			}
		}
		catch (err) {
			console.log(colors.bgCyan.white(' => Suman message => Warning - no configuration found in your project, using default Suman configuration.'));
			try {
				pth = path.resolve(__dirname + '/default-conf-files/suman.default.conf.js');
				sumanConfig = require(pth);
				global.usingDefaultConfig = true;
			}
			catch (err) {
				console.error('\n => ' + err + '\n');
				return;
			}
		}
	}
}

global.sumanConfig = sumanConfig;

/////////////////////////////////////////////////////////////////////////////////////////////////////////

if (sumanConfig.transpile === true && sumanConfig.useBabelRegister === true) {
	console.log('\n\n', ' => Suman warning => both the "transpile" and "useBabelRegister" properties are set to true in your config.\n' +
		'  The "transpile" option will tell Suman to transpile your sources to the "test-target" directory, whereas', '\n',
		' "useBabelRegister" will transpile your sources on the fly and no transpiled files will be written to the filesystem.', '\n',
		' The "useBabelRegister" property and --register flag will take precedence.');
	
	// 'The basic "transpile" option will take precedence over using "babel-register", since using "babel-register" is both' +
	// 'less performant and less transparent/debuggable.');
}

///////////////////// HERE WE RECONCILE / MERGE COMMAND LINE OPTS WITH CONFIG ///////////////////////////

if ('concurrency' in global.sumanOpts) {
	assert(Number(global.sumanOpts.concurrency) > 0, ' => Suman error => --concurrency value should be an integer greater than 0.');
}

global.maxProcs = global.sumanOpts.concurrency || sumanConfig.maxParallelProcesses || 15;
global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));
global.sumanMatches = _.uniqBy((opts.match || []).concat(sumanConfig.match || []), item => item);
global.sumanNotMatches = _.uniqBy((opts.not_match || []).concat(sumanConfig.notMatch || []), item => item);

const overridingTranspile = opts.register || (!opts.no_register && global.sumanConfig.useBabelRegister);

if (opts.no_transpile) {
	opts.transpile = false;
}
else {

	if (!opts.no_transpile && global.sumanConfig.transpile === true) {
		transpile = opts.transpile = true;
		if (!opts.sparse && !overridingTranspile && !opts.watch) {
			console.log('\n', colors.bgCyan.black.bold('=> Suman message => transpilation is the default due to ' +
				'your configuration option => transpile:true'), '\n');
		}
	}

	if (overridingTranspile) {
		if (!opts.vsparse) {
			if (global.sumanConfig.transpile === true) {
				console.log('\n ', colors.bgCyan.black.bold(' => Suman message => although transpilation is the default (due to ') + '\n  ' +
					colors.bgCyan.black.bold(' your configuration option => {transpile:true}), the ' + colors.magenta('--register') + ' flag was passed and takes precedence,') + '\n  ' +
					colors.bgCyan.black.bold(' so we will transpile on the fly with "babel-register", no transpiled files will be written out.'), '\n');
			}
			else {
				if (opts.register && opts.verbose) {
					console.log('\n', colors.bgCyan.black.bold('=> Suman message => --register flag passed, so we will transpile your sources on the fly,') + '\n' +
						colors.bgCyan.black.bold('no transpiled files will be written out.'), '\n');
				}
				else if (opts.verbose) {
					console.log('\n', colors.bgCyan.black.bold(' => Suman message => "useBabelRegister" property set to true in your config,' +
							' so we will transpile your sources on the fly.') + '\n ' +
						colors.bgCyan.black.bold(' No transpiled files will be written out. '), '\n');
				}
			}
		}
		register = global.usingBabelRegister = opts.register = true;
		transpile = opts.transpile = false;  //when using register, we don't transpile manually
	}
}

//////////////////// abort if too many top-level options /////////////////////////////////////////////

const optCheck = [useBabel, init, uninstall, convert, s, tailTest, tailRunner].filter(function (item) {
	return item;
});

if (optCheck.length > 1) {
	console.error('\t => Too many options, pick one from  { --convert, --init, --server, --use-babel, --uninstall --tail-test, --tail-runner }');
	console.error('\t => Use --help for more information.\n');
	console.error('\t => Use --examples to see command line examples for using Suman in the intended manner.\n');
	process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
	return;
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
const testDir = process.env.TEST_DIR = path.resolve(root + '/' + (global.sumanConfig.testDir || 'test'));
const testSrcDir = process.env.TEST_SRC_DIR = path.resolve(root + '/' + global.sumanConfig.testSrcDir);
const testDestDir = process.env.TEST_DEST_DIR = path.resolve(root + '/' + global.sumanConfig.testDestDir);
const testDirCopyDir = process.env.TEST_DIR_COPY_DIR = path.resolve(root + '/' + (global.sumanConfig.testDirCopyDir || 'test-target'));

if(process.env.SUMAN_DEBUG === 'yes'){
	// console.log(' SUMAN_DEBUG message => process.env =', util.inspect(process.env));
}

////////////////////////////////////////////////////////////////////////////////////////////

if (tail) {
	require('./lib/make-tail/tail-any')(paths);
}
else if (useBabel) {
	
	require('./lib/use-babel/use-babel')(null, function (err, stdout, stderr) {
		if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
			console.log('\n', colors.bgYellow(' => Error => Babel was *not* installed successfully globally.'));
			console.log('\n', stdout);
			console.log('\n', stderr);
		}
		else {
			console.log('\n', colors.bgGreen.blue('Babel was installed successfully into your local project.'), '\n');
			console.log('\n', colors.bgGreen.blue(' => To learn about how to use Babel with Suman, visit *.'), '\n');
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

	if (!sumanServerInstalled) {
		throw new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" in your local project ' + err3.stack);
	}

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

	const timestamp = global.timestamp = Date.now();
	const networkLog = global.networkLog = makeNetworkLog(timestamp);
	const server = global.server = findSumanServer(null);

	function checkStatsIsFile(item) {

		if (process.env.SUMAN_DEBUG === 'yes') {
			console.log(' => SUMAN_DEBUG => checking if "' + item + '" is a file.');
		}

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

	if (paths.length < 1) {
		paths = [testDir];
	}

	async.series({  //used to be async.series

		installSumanServer: function (cb) {
			if (opts.use_server) {
				cp.exec('npm install --save suman-server', function (err) {
					if (err) {
						err.stack = ' => To fix this error, please run "$ npm install --save suman-server" in your local project ' +
							'with the correct permissions\n' + err.stack;
					}
					cb(err);
				});
			}
			else {
				process.nextTick(cb);
			}
		},

		watchFiles: function (cb) {

			if (!sumanServerInstalled) {
				process.nextTick(function () {
					cb(new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" in your local project ' + err3.stack));
				});
			}
			else if (global.sumanOpts.watch) {
				require('./lib/watching/add-watcher')(paths, cb);
			}
			else if (global.sumanOpts.stop_watching) {
				require('./lib/watching/stop-watching')(paths, cb);
			}
			else {
				process.nextTick(cb);
			}

		},

		parallelTasks: function (cb) {

			async.parallel({
				npmList: function (cb) {
					cp.exec('npm view suman version', function (err, stdout, stderr) {
						if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
							cb(err || stdout || stderr);
						}
						else {
							console.log(' => Newest Suman version in the NPM registry:', stdout);
							// if (pkgDotJSON) {
							// 	console.log(' => Locally installed Suman version:', pkgDotJSON.version);
							// }
							cb(null);
						}
					});
				},

				transpileFiles: function (cb) {

					if (originalTranspileOption || (!opts.watch && transpile)) {
						require('./lib/transpile/run-transpile')(paths, opts, cb);
					}
					else {
						process.nextTick(function () {
							cb(null, []);
						});
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

			}, cb);
		}

	}, function complete(err, results) {
		
		if (err) {
			console.log('\n\n => Suman fatal problem => ' + (err.stack || err), '\n\n');
			return process.exit(1);
		}
		
		if (opts.watch) {
			console.log('\n\n\t => Suman server running locally now listening for files changes ' +
				'and will run and/or transpile tests for you as they change.');
			console.log('\n\n\t => Suman message => the ' + colors.magenta('--watch') + ' option is set, ' +
				'we are done here for now.');
			console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
				'use the --verbose or --vverbose options\n\n');
			return process.exit(0);
		}
		
		if (opts.stop_watching) {
			console.log('\n\n\t => Suman message => the ' + colors.magenta('--no-run') + ' option is set, ' +
				'we are done here for now.');
			console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
				'use the --verbose or --vverbose options\n\n');
			return process.exit(0);
		}
		
		if (opts.vverbose) {
			console.log('=> Suman vverbose message => "$ npm list -g" results: ', results.npmList);
		}
		
		function changeCWDToRootOrTestDir(p) {
			if (opts.cwd_is_root) {
				process.chdir(root);
			}
			else {
				process.chdir(path.dirname(p));  //force CWD to test file path // boop boop
			}
		}
		
		const d = domain.create();
		
		d.once('error', function (err) {
			//TODO: add link showing how to set up Babel
			console.error(colors.magenta(' => Suman fatal error => ' + err.stack + '\n'));
			process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
		});
		
		var originalPaths = null;
		var originalPathsMappedToTranspilePaths = null;
		
		if (transpile) {
			
			originalPaths = _.flatten(paths).map(function (item) {
				return path.resolve(path.isAbsolute(item) ? item : (root + '/' + item));
			});
			
			if (opts.all && paths.length < 1) {
				opts.recursive = true;
				paths = [testDirCopyDir];
			}
			else if (opts.sameDir) {
				opts.recursive = true;
				paths = [testDestDir];
			}
			else {
				paths = results.parallelTasks.transpileFiles.map(item => item.targetPath);
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
			
			if (!opts.sparse) {
				console.log('\n', colors.bgBlue.white.bold(' Suman will attempt to execute test ' +
						'files with/within the following paths: '), '\n\n',
					paths.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.blue('"' + p + '"')).join('\n') + '\n');
			}
			
			if (opts.vverbose) {
				console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
					'Suman will execute test files from the following locations:'), '\n', paths, '\n');
			}
			
			//TODO: if only one file is used with the runner, then there is no possible blocking,
			// so we can ignore the suman.order.js file,
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
			// else if (!useRunner && transpile && originalPaths.length === 1 && checkStatsIsFile(originalPaths[0])) {
			//
			// 	//TODO: need to learn how many files matched
			//
			// 	d.run(function () {
			// 		process.nextTick(function () {
			// 			changeCWDToRootOrTestDir(originalPaths[0]);
			// 			require('./lib/run-child-not-runner')(originalPaths[0]);
			// 		});
			// 	});
			//
			// }
			// else if (!useRunner && transpile && paths.length === 1 && checkStatsIsFile(paths[0])) {
			//
			// 	//TODO: need to learn how many files matched
			//
			// 	d.run(function () {
			// 		process.nextTick(function () {
			// 			changeCWDToRootOrTestDir(paths[0]);
			// 			require('./lib/run-child-not-runner')(paths[0]);
			// 		});
			// 	});
			//
			// }
			else if (process.env.SUMAN_SINGLE_PROCESS === 'yes' && !useRunner) {
				d.run(function () {
					process.nextTick(function () {
						changeCWDToRootOrTestDir(root);
						const match = global.sumanMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));
						const notMatch = global.sumanNotMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));
						const files = require('./lib/runner-helpers/get-file-paths')(paths, match, notMatch);
						global.sumanSingleProcessStartTime = Date.now();
						require('./lib/run-child-not-runner')(sumanUtils.removeSharedRootPath(files));
					});
				});
			}
			else if (!useRunner && paths.length === 1 && checkStatsIsFile(paths[0])) {
				
				//TODO: we could read file in (fs.createReadStream) and see if suman is referenced
				
				d.run(function () {
					process.nextTick(function () {
						changeCWDToRootOrTestDir(paths[0]);
						require('./lib/run-child-not-runner')(paths);
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
