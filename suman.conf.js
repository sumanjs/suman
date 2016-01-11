/**
 * Created by amills001c on 12/15/15.
 */


module.exports = Object.freeze({

    uniqueAppName: 'suman',
    NODE_ENV: 'development',
    //outputDir: '/results',
    pipeStdOut: 'bunyan',
    MAX_TOTAL_MEMORY: 3000,
    browser: 'Firefox',
    disableAutoOpen: false,
    expireResultsAfter: '10000000',
    resultsCapCount: 100,
    resultsCapSize: 7000, // 3 gb's
    output: {
        'standard': {},
        'basic': {},
        'web': {
            outputDir: '/results'
        }
    },
    server:{
        host: 'localhost',
        port: 6969,
    }

});