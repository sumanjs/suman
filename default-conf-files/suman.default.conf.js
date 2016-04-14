//**************************************************************************************************
// Default Suman config file, should always remain at the root of your project
// *************************************************************************************************


const os = require('os');
const path = require('path');


module.exports = Object.freeze({

    sumanRunner: {},

    sumanServer: {},

    opts:{
       //these can be set by the command line
    },

    useSuiteNameInTestCaseOutput: false,
    warningLevel: 3,
    noFrills: false,
    defaultTestSuiteTimeout: 15000,
    maxParallelProcesses: 25,           //maximum parallel processes running at one time
    ultraSafe: false,                   //if true, Suman reads files before executing any supposed test file and makes sure it's a suman test before running
    verbose: true,                      //handles and logs warnings (using warning level?)
    checkMemoryUsage: false,            //limits stack traces to just relevant test case or test line
    fullStackTraces: false,             //allows you to view more than 3 lines for errors in test cases and hooks
    uniqueAppName: 'suman',
    NODE_ENV: 'development',            // NODE_ENV to use if you don't specify one
    pipeStdOut: 'bunyan',
    browser: 'Firefox',                 // browser to open test results with
    disableAutoOpen: false,             // use true if you never want suman to automatically open the browser to the latest test results
    expireResultsAfter: '10000000',     // test results will be deleted after this amount of time
    resultsCapCount: 100,               // test results will be deleted if they are 101st oldest run
    suppressRunnerOutput: true,         // forget what this is for LOL
    resultsCapSize: 7000, // 3 gb's     // oldest test results will be deleted if the results dir expands beyond this size


    output: {
        'standard': {},
        'basic': {},
        'web': {
            servers: ['localhost']
        }
    },

    aux: {
        once: 'suman/suman.once.js',        // location of your main IoC file (canonical location is the root of your project)
        order: 'suman/suman.order.js',      // location of your main IoC file (canonical location is the root of your project)
        ioc: 'suman/suman.ioc.js',          // location of your main IoC file (canonical location is the root of your project)

    },

    ioc: 'suman/suman.ioc.js',          // location of your main IoC file (canonical location is the root of your project)
    once: 'suman/suman.once.js',        // location of your main IoC file (canonical location is the root of your project)
    order: 'suman/suman.order.js',      // location of your main IoC file (canonical location is the root of your project)

    reporters: {},

    defaultSumanResultsDir: (process.env.HOME || process.env.USERPROFILE) + '/suman_results',

    servers: {                           // list of servers to output test result data to, with the os.hostname() as the key

        '*default': {
            host: '127.0.0.1',
            port: 6969,
            outputDir: path.resolve(process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')] + '/suman_results')
        }
    }

});