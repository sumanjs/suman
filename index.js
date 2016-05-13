#!/usr/bin/env node --harmony


/////////////////////////////////////////////////////////////////


if (require.main !== module || process.argv.indexOf('--suman') > -1) {
    //prevents users from f*king up by accident and getting in some possible infinite process.spawn loop that will lock up their system
    //most likely protects the very unlikely case that suman runs itself, which would cause mad infinite proces spawns
    console.log('Warning: attempted to require Suman index.js but this cannot be.');
    return;
}


process.on('SIGINT', () => {
    console.log('Suman got your SIGINT => Press Control-C *twice* to exit.');
});


/////////////////////////////////////////////////////////////////

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
// const requireFromString = require('require-from-string');


//#project
const constants = require('./config/suman-constants');

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
const root = sumanUtils.findProjectRoot(process.cwd());
const makeNetworkLog = require('./lib/make-network-log');
const findSumanServer = require('./lib/find-suman-server');

////////////////////////////////////////////////////////////////////

const opts = require('./lib/parse-cmd-line-opts/parse-opts');

////////////////////////////////////////////////////////////////////

global.viaSuman = true;
global.resultBroadcaster = new EE();

if (process.env.NODE_ENV === 'dev_local_debug' || opts.vverbose) {
    console.log("# opts:", opts);
    console.log("# args:", opts._args);
}

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


var sumanInstalledLocally = true;

var err;

try {
    require.resolve(root + '/node_modules/suman');
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


var sumanConfig, pth;

//TODO: use harmony destructuring args later on
const configPath = opts.config;
const serverName = opts.server_name;
const convert = opts.convert;
const src = opts.src;
const dest = opts.dest;
const init = opts.init;
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
const transpile = opts.transpile;


var targetTestDir;

if (transpile) {
    targetTestDir = path.resolve(root + '/test-target');
}


try {
    //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test

    pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
    sumanConfig = require(pth);
    if (sumanConfig.verbose !== false) {  //default to true
        console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
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
        if (sumanConfig.verbose !== false) {  //default to true
            console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
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

global.sumanConfig = sumanConfig;

const optCheck = [init, uninstall, convert, s, tailTest, tailRunner].filter(function (item) {
    return item;
});

if (optCheck.length > 1) {
    console.error('\tIf you choose one of the following options, you may only pick one option  { --convert, --init, --server }');
    console.error('\tUse --help for more information.\n');
    process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
    return;
}

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
var dirs = JSON.parse(JSON.stringify(opts._args)).filter(function (item) {
    if (String(item).indexOf('-') === 0) {
        console.log(colors.magenta(' => Suman warning => Probably a bad command line option "' + item + '", Suman is ignoring it.'))
        return false;
    }
    return true;
});

if (tailRunner) {
    require('./lib/make-tail/tail-runner');
}
else if (tailTest) {
    require('./lib/make-tail/tail-test');
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
else if (coverage) {

    if (dirs.length < 1) {
        console.error('\n   ' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
        process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
        return;
    }
    else {

        //TODO: if only one file is used with the runner, then there is no possible blocking, so we can ignore the suman.order.js file,
        // and pretend it does not exist.

        dirs = dirs.map(function (item) {
            return path.resolve(item);
        });  //TODO: filter out any non .js files?

        require('./lib/run-coverage/exec-istanbul')(dirs, false);

    }

}
else if (convert) {

    if (!force) {
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

    const timestamp = global.timestamp = Date.now();
    const networkLog = global.networkLog = makeNetworkLog(sumanConfig, timestamp);
    const server = global.server = findSumanServer(sumanConfig, null);


    networkLog.createNewTestRun(sumanConfig, server, function (err) {

        if (err) {
            console.error(err.stack);
            process.exit(constants.RUNNER_EXIT_CODES.ERROR_INVOKING_NETWORK_LOG_IN_RUNNER);
        }
        else {

            async.series([
                    function conductStaticAnalysisOfFilesForSafety(cb) {
                        if (global.sumanOpts.safe) {
                            throw new Error('safe option not yet implemented');
                        }
                        else {
                            process.nextTick(cb);
                        }
                    },
                    function conductSafetyCheckNow(cb) {
                        async.each([], function (item, cb) {

                        }, cb);
                    },
                    function transpileFiles(cb) {
                        if (transpile) {
                            cp.exec('cd ' + root + ' && rm -rf test-target', function (err, stdout, stderr) {
                                if (err || String(stdout).match(/error/i) || String(stderr).match(/error/i)) {
                                    cb(err || stdout || stderr);
                                }
                                else {
                                    const g = require('./gulpfile');
                                    async.each(dirs, function (item, cb) {
                                        item = path.resolve(root + '/' + item);
                                        const truncated = sumanUtils.removeSharedRootPath([item, targetTestDir]);
                                        const file = truncated[0][1];
                                        const indexOfFirstStart = String(file).indexOf('*');
                                        const temp = String(file).substring(0, indexOfFirstStart);
                                        g.transpileTests([item], 'test-target' + temp).on('finish', cb).on('error', cb);
                                    }, cb);

                                }
                            });
                        }
                        else {
                            process.nextTick(cb);
                        }

                    }
                ],
                function (err, results) {

                    if (err) {
                        throw err;
                    }

                    const d = domain.create();
                    const args = opts._args;

                    d.once('error', function (err) {
                        //TODO: add link showing how to set up Babel
                        console.error(colors.magenta(' => Suman warning => (note: You will need to transpile your test files manually' +
                            ' if you wish to use ES7 features, or use $ suman-babel instead of $ suman.)' + '\n' +
                            ' => Suman error => ' + err.stack + '\n'));
                        process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
                    });

                    if (transpile) {
                        dirs = [path.resolve(root + '/test-target')];
                    }


                    if (dirs.length < 1) {
                        console.error('\n\t' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
                        process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
                    }
                    else {

                        dirs = dirs.map(function (item) {
                            return path.resolve(item);
                        });

                        //TODO: if only one file is used with the runner, then there is no possible blocking, so we can ignore the suman.order.js file,
                        // and pretend it does not exist.

                        if (!useRunner && dirs.length === 1 && fs.statSync(dirs[0]).isFile()) {
                            //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
                            d.run(function () {
                                process.nextTick(function () {
                                    process.chdir(path.dirname(dirs[0]));  //force CWD to test file path // boop boop
                                    require(dirs[0]);  //if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
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
                                        fileOrDir: dirs
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

    });

}
