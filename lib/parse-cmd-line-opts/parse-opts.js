/**
 * Created by denman on 4/22/2016.
 */


//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');

//npm
const dashdash = require('dashdash');
const colors = require('colors/safe');

//#project
const sumanUtils = require('../utils');
const constants = require('../../config/suman-constants');

const options = [
    {
        names: ['all', 'a'],
        type: 'bool',
        help: 'Used in conjunction with the --transpile option, to transpile the whole test directory to test-target.'
    },
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
        type: 'arrayOfBool',
        help: 'Verbose output. Use multiple times for more verbose.'
    },
    {
        names: ['vverbose', 'vv'],
        type: 'bool',
        help: 'Very verbose output. There is either verbose or very verbose (vverbose).'
    },
    {
        names: ['sparse'],
        type: 'bool',
        help: 'Sparse output. Less verbose than standard.'
    },
    {
        names: ['vsparse'],
        type: 'bool',
        help: 'Very sparse output. Even less verbose than sparse option.'
    },
    {
        names: ['init'],
        type: 'bool',
        help: 'Initialize Suman in your project; install it globally first.'
    },
    {
        names: ['uninstall'],
        type: 'bool',
        help: 'Uninstall Suman in your project.'
    },
    {
        names: ['no-runner-lock'],
        type: 'bool',
        help: 'Don\'t user runner lock'
    },
    {
        names: ['runner-lock'],
        type: 'bool',
        help: 'Use a global runner lock'
    },
    {
        names: ['interactive'],
        type: 'bool',
        help: 'Use this flag option to generate a well-formed Suman command interactively.'
    },
    {
        names: ['no-tables'],
        type: 'bool',
        help: 'No ascii tables will be outputted to terminal. Accomplished also by "--vsparse" boolean option'
    },
    {
        names: ['use-babel'],
        type: 'bool',
        help: 'Suman will download and install the "babel" related dependencies necessary to transpile to your local project.'
    },
    {
        names: ['uninstall-babel'],
        type: 'bool',
        help: 'Suman will * uninstall * the "babel" related dependencies necessary to transpile to your local project.'
    },
    {
        names: ['remove-babel', 'rm-babel'],  // this flag is only used when uninstalling suman as well
        type: 'bool',
        help: 'Suman will * uninstall * the "babel" related dependencies necessary to transpile to your local project.'
    },
    {
        names: ['use-server'],
        type: 'bool',
        help: 'Suman will download and install the "suman-server" dependencies necessary for file-watching to your local project.'
    },
    {
        names: ['use-istanbul'],
        type: 'bool',
        help: 'Suman will download and install the Istanbul dependencies necessary to run test coverage on your local project.'
    },
    {
        names: ['errors-only'],
        type: 'bool',
        help: 'Show only errors when logging test results.',
        default: false
    },
    {
        names: ['match-any'],
        type: 'arrayOfString',
        help: 'Use this to filter input to match the given JS regex',
    },
    {
        names: ['match-none'],
        type: 'arrayOfString',
        help: 'Use this to filter input to ignore matches of the given JS regex',
    },
    {
        names: ['match-all'],
        type: 'arrayOfString',
        help: 'Use this to filter input to ignore matches of the given JS regex',
    },
    {
        names: ['register'],
        type: 'bool',
        help: 'Use babel-core register to transpile sources on the fly, even in child processes.'
    },
    {
        names: ['no-register'],
        type: 'bool',
        help: 'Prevent usage of babel-register.'
    },
    {
        names: ['sort-by-millis'],
        type: 'bool',
        help: 'Prints a duplicate Runner results table sorted by millis fastest to slowest.'
    },
    {
        names: ['create'],
        type: 'arrayOfString',
        help: 'Create suman test skeleton at path.'
    },
    {
        names: ['coverage'],
        type: 'bool',
        help: 'Run Suman tests and see coverage report.'
    },
    {
        names: ['force-cwd-to-be-project-root', 'cwd-is-root'],
        type: 'bool',
        help: 'Run Suman tests and force cwd to be the project root.'
    },
    {
        names: ['force-cwd-to-test-file-dir', 'cwd-is-tfd'],
        type: 'bool',
        help: 'Will force the cwd for the runner child_processes to be the directory that contains the test file.'
    },
    {
        names: ['test-file-mask', 'tfm'],
        type: 'string',
        help: 'Use this option to specify which of files.'
    },
    {
        names: ['recursive', 'r'],
        type: 'bool',
        help: 'Use this option to recurse through sub-directories of tests.'
    },
    {
        names: ['safe'],
        type: 'bool',
        help: 'Reads files in with fs.createReadStream and makes sure it\'s a suman test before running'
    },
    {
        names: ['force', 'f'],
        type: 'bool',
        help: 'Force the command at hand.'
    },
    {
        names: ['fforce', 'ff'],
        type: 'bool',
        help: 'Force the command at hand, with super double force.'
    },
    {
        names: ['pipe', 'p'],
        type: 'bool',
        help: 'Pipe data to Suman using stdout to stdin.'
    },
    {
        names: ['convert', 'cnvt'],
        type: 'bool',
        help: 'Convert Mocha test file or directory to Suman test(s).'
    },
    {
        names: ['bail', 'b'],
        type: 'bool',
        help: 'Bail upon the first test error.'
    },
    {
        names: ['ignore-break'],
        type: 'bool',
        help: 'Use this option to aid in the debugging of child_processes.'
    },
    {
        names: ['runner', 'rnr'],
        type: 'bool',
        help: 'Sole purpose of this flag is to force the usage of the runner when executing only one test file.'
    },
    {
        names: ['watch', 'w'],
        type: 'bool',
        help: 'Flag to be used so that test files will be transpiled/run as soon as they are saved. Starts up the Suman server if it is not already live,' +
        'and begins watching the files desired.'
    },
    {
        names: ['stop-watching-all', 'swa'],
        type: 'bool',
        help: 'Flag so that Suman server stops watching all files for any changes.'
    },
    {
        names: ['rand', 'random'],
        type: 'bool',
        help: 'Flag to randomize tests.'
    },
    {
        names: ['testing'],
        type: 'bool',
        help: 'Internal flag for development purposes.'
    },
    {
        names: ['stop-watching', 'sw'],
        type: 'bool',
        help: 'Option to tell Suman server to stop watching the files/directories passed as arguments.'
    },
    {
        names: ['concurrency', 'mpp'],
        type: 'integer',
        help: 'Specifiy the maximum number of parallel child processes.'
    },
    {
        names: ['src'],
        type: 'string',
        help: 'Specify single path to directory of Mocha test source files for conversion to Suman from Mocha.'
    },
    {
        names: ['dest'],
        type: 'string',
        help: 'Specify single path as dest directory for conversion to Suman from Mocha.'
    },
    {
        names: ['reporters'],
        type: 'arrayOfString',
        help: 'Specify name of reporters to be used deemed by your config file.'
    },
    {
        names: ['reporter-paths'],
        type: 'arrayOfString',
        help: 'Specify reporters by specifying path(s) to reporter module(s).'
    },
    {
        names: ['diagnostics'],
        type: 'bool',
        help: 'Run diagnostics to see if something may be wrong with your suman.conf.js file and/or project structure.'
    },
    {
        names: ['transpile', 't'],
        type: 'bool',
        help: 'Transpile tests to test-target.'
    },
    {
        names: ['no-transpile', 'nt'],
        type: 'bool',
        help: 'Useful when the default is set to transpile:true in your config. Prevents transpilation and runs test files directly.'
    },
    {
        names: ['no-run'],
        type: 'bool',
        help: 'When --watch and --transpile are set to true, "--no-run" prevents Suman from executing the resulting tests, when a watched file changes on' +
        'the filesystem. In other words, the file will only be transpiled but not executed as part of the watch process.'
    },
    {
        names: ['full-stack-traces', 'fst'],
        type: 'bool',
        help: 'Full stack traces will be shown for all exceptions, including test failures.'
    },
    {
        names: ['processes', 'procs'],
        type: 'integer',
        help: 'Override config value for maximum number of parallel Node.js processes.'
    },
    {
        names: ['server', 's'],
        type: 'bool',
        help: 'Start the suman server manually.'
    },
    {
        names: ['config', 'cfg'],
        type: 'string',
        help: 'Path to the suman.conf.js file you wish to use.'
    },
    {
        names: ['no-silent'],
        type: 'bool',
        help: 'When running a single test file, stdout will be shown.'
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
        names: ['tail'],
        type: 'bool',
        help: 'Option to tail the suman log files.'
    }
];

/////////////////////////////////////////////////////////////////////

var opts, parser = dashdash.createParser({options: options});

try {
    opts = parser.parse(process.argv);
} catch (err) {
    console.error(' => Suman command line options error: %s', err.message);
    console.error(' => Try "$ suman --help" or visit oresoftware.github.io/suman');
    process.exit(constants.EXIT_CODES.BAD_COMMAND_LINE_OPTION);
}

// Use `parser.help()` for formatted options help.
if (opts.help) {
    process.stdout.write('\n');
    var help = parser.help({includeEnv: true}).trimRight();
    console.log('usage: suman [file/dir] [OPTIONS]\n\n'
        + colors.magenta('options:') + '\n'
        + help);
    process.stdout.write('\n');
    process.exit(0);
}

if (opts.concurrency) {
    assert(typeof opts.concurrency === 'number', '--concurrency value must be a positive integer');
    assert(opts.concurrency !== 0, '--concurrency value must be a positive integer');
}

if (opts.fforce) {
    opts.force = true;
}

if (opts.verbose && opts.verbose.length > 1) {
    opts.vverbose = true;
}

if (opts.vverbose) {
    opts.verbose = true;
}

if (opts.vsparse) {
    opts.sparse = true;
}

if (process.env.SUMAN_DEBUG == 'yes' || opts.vverbose) {
    console.log(' => Suman opts:', opts);
    console.log(' => Suman args:', opts._args);
}

/*

 note: moved this to index.js because suman.conf.js may set opts.transpile as well

 if (opts.transpile) {
 opts.recursive = true;
 }
 */

global.sumanOpts = opts;
global.sumanArgs = opts._args;

module.exports = opts;