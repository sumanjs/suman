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
        names: ['no-tables'],
        type: 'bool',
        help: 'No ascii tables will be outputted to terminal. Accomplished also by "--vsparse" boolean option'
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
        names: ['ignore-brk'],
        type: 'bool',
        help: 'Use this option to aid in the debugging of child_processes.'
    },
    {
        names: ['runner', 'rnr'],
        type: 'bool',
        help: 'Use runner even when executing only one test file.'
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
        names: ['no-silent'],
        type: 'bool',
        help: 'When running a single test file, stdout will be shown.'
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
        names: ['tail-runner', 'tlrnr'],
        type: 'bool',
        help: 'Option to tail the suman-err.log file defined by the path in your suman config.'
    },
    {
        names: ['tail-test', 'tltst'],
        type: 'bool',
        help: 'Option to tail the suman-err.log file defined by the path in your suman config.'
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


if (opts.fforce) {
    opts.force = true;
}

if (opts.vverbose) {
    opts.verbose = true;
}

if (opts.vsparse) {
    opts.sparse = true;
}

global.sumanOpts = opts;
global.sumanArgs = opts._args;


module.exports = opts;