/**
 * Created by amills001c on 12/15/15.
 */


var os = require('os');
var path = require('path');


module.exports = Object.freeze({

    safe: false,                             //if true, Suman reads files in with fs.createReadStream before running any file and makes sure it's a suman test before running
    verbose: true,                           //handles and logs warnings (using warning level?)
    checkMemoryUsage: false,                 //limits stack traces to just relevant test case or test line
    fullStackTraces: false,                  //
    uniqueAppName: 'suman',
    NODE_ENV: 'development',                 //NODE_ENV to use if you don't specify one
    pipeStdOut: 'bunyan',
    //MAX_TOTAL_MEMORY: 3000,                // you may wish to limit memory usage by suman when running many tests in parallel, but be careful and read about V8
    browser: 'Firefox',                      // browser to open test results with
    disableAutoOpen: false,                  // use true if you never want suman to automatically open the browser to the latest test results
    expireResultsAfter: '10000000',          // test results will be deleted after this amount of time
    resultsCapCount: 100,                    // test results will be deleted if they are 101st oldest run
    suppressRunnerOutput: true,              // forget what this is for LOL
    resultsCapSize: 7000, // 3 gb's          // oldest test results will be deleted if the results dir expands beyond this size
    output: {
        'standard': {},
        'basic': {},
        'web': {
            servers: ['localhost']
        }
    },

    ioc: 'suman.ioc.js',                    // location of your main IoC file (canonical location is the root of your project)

    reporters:{

    },


    servers: {                              // list of servers to output test result data to, with the os.hostname() as the key

        '*default':{
            host: '127.0.0.1',
            port: 6969,
            outputDir: path.resolve(process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')] + '/suman_results')
        }
    }

});