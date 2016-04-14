#!/usr/bin/env node --harmony


/*

 if (require.main !== module || process.argv.indexOf('--suman') > -1) {
 //prevents users from f*king up by accident and getting in some possible infinite process.spawn loop that will lock up their system
 console.log('Warning: attempted to require Suman index.js but this cannot be.');
 return;
 }

 */

/*// Start reading from stdin so we don't exit.
 process.stdin.resume();

 process.on('SIGINT', () => {
 console.log('Got SIGINT.  Press Control-D to exit.');
 });*/


/*

 tests passed: 5
 tests failed: 4
 tests stubbed:4
 tests skipped:  30 (only is triggerred)
 suites skipped: 2

 */


//TODO: need glob support for source //https://github.com/isaacs/node-glob
//TODO: to be compliant with Babel, need to put context for functions in extra param
//TODO: https://github.com/gotwarlost/istanbul/issues/596#issuecomment-208688593
//TODO: http://blog.yld.io/2016/01/13/using-streams/#.VwyjZZMrKXk
//TODO: freeze module.exports inside the init fn, iff module.exports.keys.lenght ===0
//TODO: http://stackoverflow.com/questions/10753288/how-to-specify-test-directory-for-mocha
//TODO: https://github.com/substack/picture-tube
//TODO: one possible solution is to name files that aren't supposed to be run directly with another extension besides .js
//TODO: set up recursive option for runner
//TODO: need to test skip and only thoroughly
//TODO: hooks after suman runs (opposite of suman.once.js) could be for collecting code/test coverage
//TODO: whatever is returned in a beforeEach hook should be assigned to each test (?) NO, multiple hooks would overwrite ret
//TODO: suman postinstall script
//TODO: add hyperlinks to terminal window for table output
//TODO: give ability to users to provide shell scripts to launch individual mocha tests, that way they can provide environment
// settings for child_process
//TODO: add option to choose mode:'series'/'parallel'
//TODO: bail + hooks https://github.com/mochajs/mocha/issues/690
//TODO: hooks always run ==> less conditionals ==> even if all tests are stubbed out, hooks still run, which makes sense
//TODO: conversion, this.title needs to work for a describe block (same as this.desc)
//TODO: add support question to gulp github to see if we can use special key combo with gulp for below item
//TODO: add suman.gulp.js => watches with special key combo will transpile tests
//TODO: need to add ability to kill test runner after it's started - https://gist.github.com/tedmiston/5935757
//TODO: nice docs => https://cdnjs.com/libraries/backbone.js/tutorials/organizing-backbone-using-modules
//TODO: https://github.com/mochajs/mocha/issues/492
//TODO: https://www.npmjs.com/package/tap-mocha-reporter
//TODO: need to make sure to make suman_results readable/writable
//TODO: need to figure out way to grep suite name without having to run the test
//TODO: add option to do no reporting but at command line for speed
//TODO: need to handle stubbed tests
//TODO: need to implement  -b, --bail   => bail after first test failure
//TODO: suman command line input should allow for a file and directory combination
//TODO: suman --init should install suamn node_module, and suman directory at root of project, and suman.conf.js at root of project
//TODO: readme needs to have examples by ES5, ES6, ES7
//TODO: default configuration should provide default values using lodash defaults / underscore defaults
//TODO: switch from underscore to lodash
//TODO: get it to work with Istanbul/NYC  <<
//TODO: if no tests are run, need to indicate this
//TODO: special key combo (ctrl+save+r) will run tests after a change, using gulp file watchers?
//TODO: https://nodejs.org/en/blog/uncategorized/profiling-node-js/
//TODO: npm i babel -g, then babel-node --stage 0 myapp.js
//TODO: https://github.com/nodejs/node/issues/5252
//TODO: http://www.node-tap.org/basics/
//TODO: need a suman server stop command at the command line
//TODO, along with options {timeout:true}, {parallel:true}, {delay:100} we should have {throws:true}, so that we expect a test to throw an (async) error...
//TODO: if error is thrown after test is completed (in a setTimeout, for example) do we handle that?
//TODO: if suman/suman runner runs files and they are not suman suites, then suman needs to report that!!
//TODO: if suman/suman runner runs legit suman tests but the tests have no test cases, it needs to report that too
//TODO: randomize test runs as per https://github.com/sindresorhus/ava/issues/595
//TODO: steal unicode chars from existing projects
//TODO: does babel-node work with child_prcesses?
//TODO: allow possibility to inject before/after/describe/context/it/test/beforeEach/afterEach into describes/contexts
//TODO: create suman --diagnostics option at command line to check for common problems with both project and test suites
//TODO: write metadata file out along with txt files
//TODO: exit code for runner does not match if any process exits with a code greater than 0


/////////////////////////////////////////////////////////////////

const fs = require('fs');
const path = require('path');
const os = require('os');
const domain = require('domain');
const cp = require('child_process');


//#npm
const dashdash = require('dashdash');
const colors = require('colors/safe');


//#project
const constants = require('./config/suman-constants');

////////////////////////////////////////////////////////////////////

const pkgJSON = require('./package.json');
const v = pkgJSON.version;
console.log(colors.gray.italic(' => Suman v' + v + ' running...'));

////////////////////////////////////////////////////////////////////

const cwd = process.cwd();

////////////////////////////////////////////////////////////////////

//#project
const sumanUtils = require('./lib/utils');
const suman = require('./lib');
const root = sumanUtils.findProjectRoot(process.cwd());

////////////////////////////////////////////////////////////////////


const options = [
    {
        name: 'version',
        type: 'bool',
        help: 'Print tool version and exit.'
    },
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Print this help and exit.'
    },
    {
        names: ['verbose', 'v'],
        type: 'bool',
        help: 'Verbose output. Use multiple times for more verbose.'
    },
    {
        names: ['init'],
        type: 'bool',
        help: 'Initialize Suman in your project; install it globally first.'
    },
    {
        names: ['coverage'],
        type: 'bool',
        help: 'Run Suman tests and see coverage report.'
    },
    {
        names: ['recursive', 'r'],
        type: 'bool',
        help: 'Use this option to recurse through sub-directories of tests.'
    },
    {
        names: ['force', 'f'],
        type: 'bool',
        help: 'Force the command at hand.'
    },
    {
        names: ['convert', 'cnvt'],
        type: 'bool',
        help: 'Convert Mocha test file or directory to Suman test(s).'
    },
    {
        names: ['ignore-brk'],
        type: 'bool',
        help: 'Use this option to aid in the debugging of child_processes.'
    },
    {
        names: ['runner', 'rnr'],
        type: 'bool',
        help: 'Force usage of runner when executing only one test file.'
    },
    {
        names: ['full-stack-traces', 'fst'],
        type: 'bool',
        help: 'Full stack traces will be shown for all exceptions, including test failures.'
    },
    {
        names: ['server', 's'],
        type: 'bool',
        help: 'Convert Mocha test file or directory to Suman test(s).'
    },
    {
        names: ['config', 'cfg'],
        type: 'string',
        help: 'Path to the suman.conf.js file you wish to use.'
    },
    {
        names: ['grep-file-base-name', 'gfbn'],
        type: 'string',
        help: 'Regex string used to match file names; only the basename of the file path.'
    },
    {
        names: ['grep-file', 'gf'],
        type: 'string',
        help: 'Regex string used to match file names.'
    },
    {
        names: ['grep-suite', 'gs'],
        type: 'string',
        help: 'Path to the suman.conf.js file you wish to use.'
    },
    {
        names: ['server-name', 'sn'],
        type: 'string',
        help: 'Path to the suman.conf.js file you wish to use.'
    },
    {
        names: ['file'],
        type: 'string',
        help: 'File to process',
        helpArg: 'FILE'
    }
];

////////////////////////////////////////////////////////////////////


var opts, parser = dashdash.createParser({options: options});
try {
    opts = parser.parse(process.argv);
} catch (e) {
    console.error(' => Suman command line options error: %s', e.message);
    console.error(' => Try "$ suman --help" or visit oresoftware.github.io/suman');
    process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

console.log("# opts:", opts);
console.log("# args:", opts._args);
global.sumanOpts = opts;
global.sumanArgs = opts._args;


// Use `parser.help()` for formatted options help.
if (opts.help) {
    process.stdout.write('\n');
    var help = parser.help({includeEnv: true}).trimRight();
    console.log('usage: suman \<file/dir>\ [OPTIONS]\n\n'
        + colors.magenta('options:') + '\n'
        + help);
    process.stdout.write('\n');
    process.exit(0);
}


//////////////////////////////////////////////////////////////////////

/**
 * Solves equations of the form a * x = b
 * @example <caption>Example usage of method1.</caption>
 * // returns 2
 * treasure maker
 * globalNS.method1(5, 10);
 * @returns {Number} Returns the value of x for the equation.
 */
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
const server = opts.server;
const useRunner = opts.runner;
const grepFile = opts.grep_file;
const grepFileBaseName = opts.grep_file_base_name;
const grepSuite = opts.grep_suite;
const coverage = opts.coverage;


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

    if(!init){
        console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file in your current working directory or given by --cfg at the command line...'));
        console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ...now looking for a config file at the root of your project...'));

    }

    try {
        pth = path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + 'suman.conf.js');
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


const optCheck = [init, convert, server].filter(function (item) {
    return item;
});

if (optCheck.length > 1) {
    console.error('\tIf you choose one of the following options, you may only pick one option  { --convert, --init, --server }');
    console.error('\tUse --help for more information.\n');
    process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
    return;
}


if (convert) {
    if (!force) {
        console.log('Are you sure you want to remove all contents within the folder with path="' + path.resolve(root + '/' + dest) + '" ?');
        console.log('If you are sure, try the same command with the -f option.');
        console.log('Oh, and by the way, before deleting dirs in general, its a good idea to run a commit with whatever source control system you are using.');
        return;
    }
}

//note: whatever args are remaining are assumed to be file or directory paths to tests
var dirs = (JSON.parse(JSON.stringify(opts._args)) || []).filter(function (item) {
    if (String(item).indexOf('-') === 0) {
        console.log(colors.magenta(' => Suman warning => Probably a bad command line option "' + item + '", Suman is ignoring it.'))
        return false;
    }
    return true;
});


if (init) {

    require('./lib/init/init-project')({
        force: force
    });

} else if (coverage) {

    if (dirs.length < 1) {
        console.error('   ' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
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

    require('./lib/convert-files/convert-dir')({
        source: src,
        dest: dest
    });

} else if (server) {

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

    const d = domain.create();
    const args = opts._args;

    d.once('error', function (err) {
        //TODO: add link showing how to set up Babel
        console.error(colors.magenta(' => Suman warning => (note: You will need to transpile your test files manually' +
            ' if you wish to use ES7 features, or use $ suman-babel instead of $ suman.)' + '\n' +
            ' => Suman error => ' + err.stack + '\n'));
        process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });


    if (dirs.length < 1) {
        console.error('   ' + colors.bgCyan.black(' => Suman error => No test file or dir specified at command line. ') + '\n\n');
        return;
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
                    process.sumanConfig = sumanConfig;
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
                        config: sumanConfig
                        //configPath: configPath || 'suman.conf.js'
                    }).on('message', function (msg) {
                        console.log('msg from suman runner', msg);
                        //process.exit(msg);
                    });
                });
            });
        }
    }
}
