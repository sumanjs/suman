#!/usr/bin/env node --harmony


//TODO: need to add option to include stdout when using runner
//TODO: npm install mocha -g --save-dev
//TODO: paths issue - suman command may not be issued in a project at all, which means findRoot(cwd) will not yield
// correct result - need to mitigate
//TODO: overall consolidated table can have a count of failed test files vs passed test files
//TODO: t.plan is useful for making sure code gets hit that might not actually run
//TODO: add max memory value in overall table for runner
//TODO: change fs.appendFileSync to fs.appendFile? no, causes corruption
//TODO: need assertions to print out pretty
//TODO: if using local server and SQLite, then each cp should save data directly to db. however, if remote server, then
// should only the parent process (runner) make the network connection? Possibly remove network code from suman file
//TODO: running with bare node executable should make no network connections and only save to local db if it exists
//TODO: fork() is just a wrapper around spawn(). You can open the file with fs.open(), then pass the file descriptor in the options as { stdio: ['inherit', fd, fd] }
//TODO: need to put std reporter in suman.conf.js
//TODO: https://github.com/nodejs/help
//TODO: runner needs to show tests in table even if they fail out before sending table data
//TODO: https://hellocoding.wordpress.com/2015/01/19/delete-all-commit-history-github/
//TODO: command to kill runner works too well, need to use ctrl+D instead
//TODO: have to allow users to use bash scripts as hooks to setup process information, this involves
// having an option to use spawn instead of fork in the runner, see ./lib/bash/a and ./lib/bash/b
//TODO: https://github.com/JacksonGariety/gulp-nodemon/issues/110#event-628179539
//TODO: did you forget to call done? should become "did you forget to call fail/pass?" etc under right conditions
//TODO: implement Test.on('end') or Test.on('completed');
//TODO: if you can get tired of using this.it, you have two options, chain them, or put them in a series/parallel block
//TODO: need glob support for source //https://github.com/isaacs/node-glob
//TODO: http://altamodatech.com/blogs/?p=452  //How To Use Mocha for Node Testing in Windows
//TODO: TESTS=$(shell find test/ -name "*.test.js")
//TODO: makefiles vs. gulp vs. plain js
//TODO: need glob support for source
//TODO: to be compliant with Babel transpilation, need to put context for functions in extra param
//TODO: https://github.com/gotwarlost/istanbul/issues/596#issuecomment-208688593
//TODO: http://blog.yld.io/2016/01/13/using-streams/#.VwyjZZMrKXk
//TODO: freeze module.exports inside the init fn, iff module.exports.keys.lenght ===0
//TODO: http://stackoverflow.com/questions/10753288/how-to-specify-test-directory-for-mocha
//TODO: https://github.com/substack/picture-tube
//TODO: need to test skip and only thoroughly
//TODO: hooks after suman runs (opposite of suman.once.js) could be for collecting code/test coverage
//TODO: whatever is returned in a beforeEach hook should be assigned to each test (?) NO, multiple hooks would overwrite ret
//TODO: suman postinstall script
//TODO: add hyperlinks to terminal window for table output
//TODO: give ability to users to provide shell scripts to launch individual mocha tests, that way they can provide environment
// settings for child_process, shell scripts should be in a directory called sh in the same directory as the test
//  see ./bash/a and ./bash/b
//TODO: bail needs to be implemented for runner as well as individual tests
//TODO: bail + hooks https://github.com/mochajs/mocha/issues/690
//TODO: hooks always run ==> less conditionals ==> even if all tests are stubbed out, hooks still run, which makes sense
//TODO: conversion, this.title needs to work for a describe block (same as this.desc)
//TODO: add support question to gulp github to see if we can use special key combo with gulp for below item
//TODO: add suman.gulp.js => watches with special key combo will transpile tests
//TODO: need to add ability to kill test runner after it's started - https://gist.github.com/tedmiston/5935757
//TODO: nice docs => https://cdnjs.com/libraries/backbone.js/tutorials/organizing-backbone-using-modules
//TODO: https://github.com/mochajs/mocha/issues/492
//TODO: https://www.npmjs.com/package/tap-mocha-reporter
//TODO: need to make sure to make suman_results readable/writable (move to sqlite3)
//TODO: need to figure out way to grep suite name without having to run the test
//TODO: need to implement  -b, --bail   => bail after first test failure
//TODO: suman command line input should allow for a file and directory combination
//TODO: readme needs to have examples by ES5, ES6, ES7
//TODO: default configuration should provide default values using lodash defaults / underscore defaults
//TODO: switch from underscore to lodash
//TODO: get it to work with Istanbul/NYC
//TODO: special key combo (ctrl+save+r) will run tests after a change, using gulp file watchers?
//TODO: https://nodejs.org/en/blog/uncategorized/profiling-node-js/
//TODO: npm i babel -g, then babel-node --stage 0 myapp.js
//TODO: https://github.com/nodejs/node/issues/5252
//TODO: need a suman server stop command at the command line
//TODO, along with options {plan:3}, {timeout:true}, {parallel:true}, {delay:100} we should have {throws:true}, so that we expect a test to throw an (async) error...
//TODO: if error is thrown after test is completed (in a setTimeout, for example) do we handle that?
//TODO: if suman/suman runner runs files and they are not suman suites, then suman needs to report that!!
//TODO: randomize test runs as per https://github.com/sindresorhus/ava/issues/595
//TODO: steal unicode chars from existing projects
//TODO: does babel-node work with child_processes?
//TODO: create suman --diagnostics option at command line to check for common problems with both project and test suites
//TODO: write metadata file out along with txt files
//TODO  need to add a delay option for tests running in a loop (why? => google github issue)
//TODO  on ms windows error messages do not always give url/link/path of test file with error
//TODO: https://github.com/nodejs/node/issues/5252#issuecomment-212784934
//TODO: need to determine how to determine if async/await if such
//TODO: implement Test.on('end') so that we can force exit the test using process.exit()
//TODO: https://github.com/sindresorhus/ava/blob/master/docs/recipes/when-to-use-plan.md
//TODO: if this.it.only is declared need to declare other test cases as "skipped"

/////////////////////////////////////////////////////////////////


/*



 if (require.main !== module || process.argv.indexOf('--suman') > -1) {
 //prevents users from f*king up by accident and getting in some possible infinite process.spawn loop that will lock up their system
 console.log('Warning: attempted to require Suman index.js but this cannot be.');
 return;
 }

 */

process.on('SIGINT', () => {
    console.log('Got SIGINT.  Press Control-D to exit.');
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

////////////////////////////////////////////////////////////////////

//68 is best

// var pictureTube = require('picture-tube');
// var tube = pictureTube({
//     cols:68
// });
//
// tube.pipe(process.stdout);
//
// fs.createReadStream('./images/suman-sm.png').pipe(tube);

///////////////////////////////////////////////////////////////////

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

function requireFromString(src, filename) {
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

const optCheck = [init, convert, server, tailTest, tailRunner].filter(function (item) {
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

} else if (coverage) {

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

            const dummyErr = 'dummy error to shortcut next task';

            async.series([
                    function A(cb) {
                        process.nextTick(function () {
                            //if safe is false or undefined, we skip the following task B, by passing dummy err
                            cb(global.sumanOpts.safe ? null : dummyErr);
                        })
                    },
                    function B(cb) {
                        async.each([], function (item, cb) {

                        }, cb);
                    }
                ],
                function (err, results) {

                    if (err && err !== dummyErr) {
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


                    if (dirs.length < 1) {
                        console.error('\n\t' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
                        process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILE_OR_DIR_SPECIFIED);
                    }
                    else {

                        //TODO: if only one file is used with the runner, then there is no possible blocking, so we can ignore the suman.order.js file,
                        // and pretend it does not exist.

                        dirs = dirs.map(function (item) {
                            return path.resolve(item);
                        });

                        if (!useRunner && dirs.length === 1 && fs.statSync(dirs[0]).isFile()) {
                            //TODO: we could read file in (fs.createReadStream) and see if suman is referenced
                            d.run(function () {
                                process.nextTick(function () {
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
                                        fileOrDir: dirs,
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
