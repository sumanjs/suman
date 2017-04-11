'use strict';

module.exports = [
  {
    names: ['all', 'a'],
    type: 'bool',
    help: 'Used in conjunction with the --transpile option, to transpile the whole test directory to test-target.'
  },
  {
    names: ['fast'],
    type: 'bool',
    help: 'Used in conjunction with the --interactive option.'
  },
  {
    names: ['no-color', 'no-colors'],
    type: 'bool',
    help: 'Tells the NPM colors module to not use any control chars for color.'
  },
  {
    names: ['version', 'vn'],
    type: 'bool',
    help: 'Print tool version and exit.'
  },
  {
    names: ['force-match'],
    type: 'bool',
    help: 'Any files passed at the command line will be run, even if they do not match any regex mentioned in config or command line.'
  },
  {
    names: ['verbosity', 'v'],
    type: 'integer',
    default: 5,
    help: 'Verbosity is an integer between 1 and 9, inclusive; the bigger the number the more verbose; default is 5.'
  },
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help menu and exit.'
  },
  {
    names: ['inherit-stdio'],
    type: 'bool',
    help: 'When using the runner, the runner (parent process) will inherit stdout/stderr from test child processes; useful' +
    'for simple and quick debugging.'
  },
  {
    names: ['touch'],
    type: 'bool',
    help: 'Platform agnostic touch. On *nix systems, it is identical to "$ touch package.json"'
  },
  {
    names: ['init'],
    type: 'bool',
    help: 'Initialize Suman in your project; install it globally first (or use suman-clis.sh).'
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
  {  ///TODO need a suman groups lock
    names: ['runner-lock'],
    type: 'bool',
    help: 'Use a global runner lock'
  },
  {
    names: ['home'],
    type: 'bool',
    help: 'Use this option to cd to the project root.'
  },
  {
    names: ['completion'],
    type: 'bool',
    help: 'Use this print out the bash completion functions to include in suman-clis.sh.'
  },
  {
    names: ['interactive'],
    type: 'bool',
    help: 'Use this option to generate a well-formed Suman command interactively.'
  },
  {
    names: ['no-tables'],
    type: 'bool',
    help: 'No ascii tables will be outputted to terminal. Accomplished also by verbosity < 2.'
  },
  {
    names: ['use-babel'],
    type: 'bool',
    help: 'Suman will download and install the necessary "babel" dependencies necessary to transpile to your local project. You could do this' +
    'yourself manually or Suman will do it intelligently for you.'
  },
  {
    names: ['uninstall-babel'],
    type: 'bool',
    help: 'Suman will * uninstall * the "babel" related dependencies that were necessary to transpile to your local project.'
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
    help: 'Suman will download and install the Istanbul dependencies necessary to run test coverage on your local project. You could do this' +
    'yourself manually or you can tell Suman to do it for you intelligently.'
  },
  {
    names: ['errors-only'],
    type: 'bool',
    help: 'Show only errors when logging test results. Also accomplished with the vsparse option.',
    default: false
  },
  {
    names: ['max-depth'],
    type: 'integer',
    help: 'Specifiy the maximum depth to recurse through directories. If you are using this option, you\'re probably doing it wrong. ' +
    '(Organizing your test directory all weird.) But the option is there for you if you need it.',
    default: 69 + 1
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
    names: ['append-match-any'],
    type: 'arrayOfString',
    help: 'Use this to filter input to match the given JS regex',
  },
  {
    names: ['append-match-none'],
    type: 'arrayOfString',
    help: 'Use this to filter input to ignore matches of the given JS regex',
  },
  {
    names: ['append-match-all'],
    type: 'arrayOfString',
    help: 'Use this to filter input to ignore matches of the given JS regex',
  },
  {
    names: ['babel-register', 'use-babel-register'],
    type: 'bool',
    help: 'Use babel-core register to transpile sources on the fly, even in child processes.'
  },
  {
    names: ['no-babel-register', 'no-use-babel-register'],
    type: 'bool',
    help: 'Prevent usage of babel-register, even useBabelRegister is set to true in your config.'
  },
  {
    names: ['sort-by-millis'],
    type: 'bool',
    help: 'Prints a duplicate Runner results table sorted by millis fastest to slowest.'
  },
  {
    names: ['create'],
    type: 'arrayOfString',
    help: 'Create suman test skeleton at the path(s) you specified.'
  },
  {
    names: ['coverage'],
    type: 'bool',
    help: 'Run Suman tests and see coverage report.'
  },
  {
    names: ['no-coverage-report', 'no-report'],
    type: 'bool',
    help: 'Run Suman tests with coverage but do not output a report.'
  },
  {
    names: ['force-cwd-to-be-project-root', 'cwd-is-root', 'force-cwd-root'],
    type: 'bool',
    help: 'Run Suman tests and force cwd to be the project root.'
  },
  {
    names: ['force-cwd-to-test-file-dir', 'cwd-is-tfd'],
    type: 'bool',
    help: 'Will force the cwd for the runner child_processes to be the directory that contains the test file.'
  },
  {
    names: ['use-container'],
    type: 'bool',
    help: 'Use this option to force-specify to use a container with --groups and suman.groups.js.'
  },
  {
    names: ['no-use-container'],
    type: 'bool',
    help: 'Use this option to force-specify to not use a container with --groups and suman.groups.js.'
  },
  {
    names: ['allow-duplicate-tests'],
    type: 'bool',
    help: 'Use this option to allow running a test more than once in the same run (with the runner).'
  },
  {
    names: ['allow-reuse-image'],
    type: 'bool',
    help: 'Use this option to force-specify to reuse all container images.'
  },
  {
    names: ['no-allow-reuse-image'],
    type: 'bool',
    help: 'Use this option to force-specify to rebuild all container images.'
  },
  {
    names: ['no-stream-to-file'],
    type: 'bool',
    help: 'Use this option to force-specify that no child process data be streamed to any files.'
  },
  {
    names: ['no-stream-to-console'],
    type: 'bool',
    help: 'Use this option to force-specify that no child process data be streamed to console.'
  },
  {
    names: ['suman-helpers-dir', 'shd'],
    type: 'string',
    internal: true,  //only visible to lib authors?
    help: 'Use this option to force-specify the directory that houses the suman helpers files.'
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
    names: ['use-tap-output', 'use-tap', 'tap'],
    type: 'bool',
    help: 'Use this option to tell Suman runner to interpret TAP output from child process(es) stdout.'
  },
  {
    names: ['no-tap'],
    type: 'bool',
    help: 'Use this option to tell Suman runner to *not* interpret TAP output from child process(es) stdout.'
  },
  {
    names: ['ignore-break'],
    type: 'bool',
    help: 'Use this option to aid in the debugging of child_processes.'
  },
  {
    names: ['ignore-uncaught-exceptions', 'iue'],
    type: 'bool',
    help: 'Use this option to aid in the debugging of child_processes.'
  },
  {
    names: ['ignore-unhandled-rejections', 'iur'],
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
    names: ['rand', 'random'],
    type: 'bool',
    help: 'Flag to randomize tests.'
  },
  {
    names: ['concurrency'],
    type: 'integer',
    help: 'Specifiy the maximum number of parallel child processes.'
  },
  {
    names: ['src'],
    type: 'string',
    help: 'Specify single path to directory of Mocha test source files for conversion to Suman from Mocha.'
  },
  {
    names: ['daemon', 'd'],
    type: 'bool',
    help: 'Allows certain Suman processes to run as a daemon.'
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
    names: ['postinstall'],
    type: 'bool',
    help: 'Using this option will (re)run the suman postinstall routine. Normally as a Suman user ' +
    'you would want to run the "suman --repair" option instead of the the "suman --postinstall" option.'
  },
  {
    names: ['install-globals'],
    type: 'bool',
    help: 'Run diagnostics to see if something may be wrong with your suman.conf.js file and/or project structure.'
  },
  {
    names: ['diagnostics'],
    type: 'bool',
    help: 'Run diagnostics to see if something may be wrong with your suman.conf.js file and/or project structure.'
  },
  {
    names: ['repair'],
    type: 'bool',
    help: 'Run the "--repair" option to install Suman deps that may be corrupted; ' +
    'and delete any stray lock files that may exist and should not exist.'
  },
  {
    names: ['browser'],
    type: 'bool',
    help: 'Tell Suman to run browser tests.'
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
    names: ['groups'],
    type: 'bool',
    help: 'Tell Suman to use the groups feature. If no arguments are passed, ' +
    'all groups will be run. Otherwise, only the group ids/names passed will be run.'
  },
  {
    names: ['config', 'cfg'],
    type: 'string',
    help: 'Path to the suman.conf.js file you wish to use.'
  },
  {
    names: ['stdout-silent'],
    type: 'bool',
    help: 'Sends stdout for all test child processes to /dev/null'
  },
  {
    names: ['silent'],
    type: 'bool',
    help: 'Sends stdout/stderr for all test child processes to /dev/null'
  },
  {
    names: ['tail'],
    type: 'bool',
    help: 'Option to tail the suman log files.'
  }
];
