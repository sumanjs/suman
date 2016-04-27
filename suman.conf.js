/**
 * Created by denman on 12/15/15.
 */


const path = require('path');


module.exports = Object.freeze({

    defaultTestSuiteTimeout: 15000,
    maxParallelProcesses: 3,
    safe: false, //reads files in with fs.createReadStream and makes sure it's a suman test before running
    verbose: true, //handles and logs warnings (using warning level?)
    checkMemoryUsage: true,
    fullStackTraces: false,
    uniqueAppName: 'suman',
    DEFAULT_NODE_ENV: 'development',
    browser: 'Firefox',
    disableAutoOpen: false,
    expireResultsAfter: '10000000',
    resultsCapCount: 100,
    suppressRunnerOutput: true,
    resultsCapSize: 7000, // 3 gb's

    defaultSumanHomeDir: function () {
        return path.normalize(path.resolve((process.env.HOME || process.env.USERPROFILE) + path.sep + 'suman_data'));
    },

    defaultSumanResultsDir: function () {
        return path.normalize(path.resolve(this.defaultSumanHomeDir() + path.sep + 'suman_results'));
    },

    reporters: {
        'tap': 'suman/reporters/tap',
        'std': ''
    },

    servers: {
        'CACSVML-16845':{
            host: '127.0.0.1',
            port: 6969,
            outputDir: '/Users/amills001c/suman_results'
        },
        'denman-lenovo': {
            host: '127.0.0.1', //10.172.47.79
            port: 6969,
            outputDir: 'C:\\Users\\denman\\suman_results'
        },
        'CACSVML-13295.local': {
            host: '127.0.0.1',
            port: 6969,
            outputDir: '/Users/amills001c/suman_results'
        },
        'smartconnect.sjc.i.sv.comcast.com': {
            host: '69.252.255.134',
            port: 6969,
            outputDir: '/home/amills/suman_results'
        },
        'dev85.plaxo.com': {
            host: '172.20.3.31',
            port: 6969,
            outputDir: '/home/amills/suman_results'
        }
    }

});