// => The Suman config file, should always remain at the root of your project
// => For more info, see =>  oresoftware.github.io/suman/conf.html
// => If transpile is true, Suman will put your babel deps in ~/.suman/global/node_modules



const os = require('os');
const path = require('path');
const numOfCPUs = os.cpus().length || 1;
const pckgDotJson = require('./package.json');
const tscPlugin = require('suman-watch-plugins/modules/tsc');
const webpackPlugin = require('suman-watch-plugins/modules/webpack');
const babelPlugin = require('suman-watch-plugins/modules/babel');

module.exports = Object.freeze({

  //regex
  matchAny: [/\.js$/, /.sh$/, /\.jar$/, /\.java$/, /\.go$/, /\.ts$/],
  matchNone: [/fixture/, /correct-exit-codes/, /@transform.sh/, /@run.sh/, /\/@target\//],
  matchAll: [],

  //string
  testDir: 'test',
  testSrcDir: 'test/src/dev/node',
  sumanHelpersDir: 'test/.suman',
  uniqueAppName: '<your-app-name-here>',
  logsDir: process.env['SUMAN_LOGS_DIR'],

  //boolean
  viewGantt: true,
  retriesEnabled: true,
  enforceUniqueTestCaseNames: true,
  logCompletedHooks: true,
  installSumanExtraDeps: true,
  installSumanGlobalsInProject: '.suman',
  isLogChildStderr: true,
  isLogChildStdout: true,
  useBabelRegister: false,
  useUtilityPatches: true, // "5".times, etc.
  coverage: false,         // collecting coverage info is expensive and we don't recommend setting this here, but instead at the command line
  useTAPOutput: false,     // TAP output will always be written out by any process, this is cheap, and true is a good setting
  errorsOnly: false,                // only show test errors in the console
  replayErrorsAtRunnerEnd: true,    // for big test runs, con
  allowArrowFunctionsForTestBlocks: true,
  alwaysUseRunner: false,                     //always run your individual tests in child process
  enforceGlobalInstallationOnly: false,
  enforceLocalInstallationOnly: false,
  sourceTopLevelDepsInPackageDotJSON: false,
  enforceTestCaseNames: true,
  enforceBlockNames: true,
  enforceHookNames: false,
  bail: true,                        // when running one file, bail will bail test at first test failure
  bailRunner: true,                  // when using the runner, bail will bail runner at first test failure in any file
  transpile: false,                  // transpile is false by default, can be overridden with command line also
  executeRunnerCWDAtTestFile: true,  // if false, CWD for runner will be project root dir
  sendStderrToSumanErrLogOnly: true,
  useSuiteNameInTestCaseOutput: false,
  ultraSafe: false,                   //if true, Suman reads files before executing any supposed test file and makes sure it's a suman test before running
  verbose: true,                      //handles and logs warnings (using warning level?)
  checkMemoryUsage: false,            //limits stack traces to just relevant test case or test line
  fullStackTraces: false,             //allows you to view more than 3 lines for errors in test cases and hooks
  disableAutoOpen: false,             // use true if you never want suman to automatically open the browser to the latest test results
  suppressRunnerOutput: true,         // this defaults to true, use no-silent or silent to switch value
  allowCollectUsageStats: true,       // allow Suman to collect usage information (no performance penalty)

  //integers
  verbosity: 5,
  maxParallelProcesses: Math.max(6, numOfCPUs),           //maximum parallel processes running at one time, synonymous with --concurrency cmd line option
  resultsCapCount: 100,               // test results will be deleted if they are 101st oldest run
  resultsCapSize: 7000, // 3 gb's     // oldest test results will be deleted if the results dir expands beyond this size

  //integers in millis
  defaultHookTimeout: 5000,
  defaultTestCaseTimeout: 5000,
  timeoutToSearchForAvailServer: 2000,
  defaultDelayFunctionTimeout: 8000,
  defaultChildProcessTimeout: 8000000,    //used with Suman runner, to kill child process if it has not exited beforehand
  defaultTestSuiteTimeout: 15000,
  expireResultsAfter: 10000000,     // test results will be deleted after this amount of time

  ////////
  //

  watch: {
    options: {
      shellExecutable: 'bash',
      soundFilePaths: {
        runtimeError: path.resolve(process.env.HOME + '/fail-trombone-02.mp3'),
        success: path.resolve(process.env.HOME + '/ta_da_sound.mp3'),
        testFailure: path.resolve(process.env.HOME + '/fail-trombone-02.mp3')
      }
    },
    per: {
      'node-dev': {
        exec: 'FORCE_COLOR=0 suman test/src/dev/node --verbosity=4',
        includes: [__dirname],
        excludes: ['/test/', /\.ts$/],
        confOverride: {},
        env: {
          FORCE_COLOR: '0'
        }
      },
      'browser-dev': {
        exec: 'suman test/src/dev/browser',
        includes: [__dirname],
        excludes: ['/test/', /\.ts$/],
        confOverride: {}
      },
      'browser-tsc': {  // suman
        exec: 'suman --runner --nt test/*.js',
        env: {
          FORCE_COLOR: '1'
        },
        plugin: tscPlugin.getValue({
          pluginCwd: path.resolve(__dirname + '/test'),
        })
      },
      'backend-babel': {
        exec: '',
        env: {
          BABEL_ENV: 'test'
        },
        plugin: babelPlugin.getValue({
          pluginEnv: {
            BABEL_ENV: 'test'
          }
        })
      },
      'browser-webpack': {  // suman rduolph agage
        exec: 'suman -b test/.suman/browser/builds/*.js',
        cwd: __dirname,
        env: {
          FORCE_COLOR: '1'
        },
        plugin: webpackPlugin.getValue({
          pluginCwd: path.resolve(__dirname + '/test'),
        })
      }
    },

  },

  browser: {
    entryPoints: [
      // {
      //   html: path.resolve(__dirname + '/test/src/dev/browser/test-file.html'),
      //   files: [],
      //   compile: function (str) {
      //
      //   }
      // },
      {
        html: path.resolve(__dirname + '/test/src/dev/browser/webpack-test.html'),
        files: [],
        compile: function (str) {

        }
      }
    ]
  },

  ////////////////////////////////////////////////////

  scripts: {
    // usage: $ suman --scripts example
    example: 'export NODE_ENV=test; echo "I love 45"; echo "NODE_ENV value => ${NODE_ENV}"'
  },

  reporters: {
    default: 'std-reporter',
    map: {
      'tap': 'suman-reporters/modules/tap-reporter'
    }

  },

  // servers: {                           // list of servers to output test result data to, with the os.hostname() as the key
  //
  //     '*default': {
  //         host: '127.0.0.1',
  //         port: 6969
  //     },
  //
  //     '###': {   /// replace this with user's local machines os.hostname()
  //         host: '127.0.0.1',
  //         port: 6969
  //     },
  //
  // },

  babelRegisterOpts: {

    // Optional ignore regex - if any filenames match this regex then they
    // aren't compiled.
    ignore: /fixture/,

    // Ignore can also be specified as a function.
    // ignore: function(filename) {
    // 	if (filename === '/path/to/es6-file.js') {
    // 		return false;
    // 	} else {
    // 		return true;
    // 	}
    // },

    // Optional only regex - if any filenames *don't* match this regex then they
    // aren't compiled
    // only: /my_es6_folder/,

    // Setting this will remove the currently hooked extensions of .es6, `.es`, `.jsx`
    // and .js so you'll have to add them back if you want them to be used again.
    extensions: ['.es6', '.es', '.jsx', '.js']
  }

});
