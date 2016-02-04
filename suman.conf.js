/**
 * Created by amills001c on 12/15/15.
 */

//jarvisc - 69.252.255.134

//TODO need to add a delay option for tests running in a loop
//TODO add option of timestamp of when test started/completed

module.exports = Object.freeze({

    checkMemoryUsage: true,
    fullStackTraces: false,
    uniqueAppName: 'suman',
    NODE_ENV: 'development',
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
            servers: ['local']
        }
    },
    //server: {
    //    host: 'localhost',
    //    port: 6969,
    //    outputDir: '/suman_results'
    //},
    //server: {
    //    host: '69.252.255.134',
    //    port: 6969,
    //    outputDir: '/suman_results'
    //},
    //remoteServer: {
    //    host: 'localhost',
    //    port: 6969,
    //    outputDir: '/suman_results'
    //},

    //defaultServer: 'dev85.plaxo.com',
    defaultServer: 'local',

    servers: {
        'localhost': {
            host: '127.0.0.1', //10.172.47.79
            port: 6969,
            outputDir: 'C:\\Users\\denman\\suman_results'
        },
        'local': {
            host: '127.0.0.1', //10.172.47.79
            port: 6969,
            outputDir: '/Users/amills001c/suman_results'
        },
        'jarvissc': {
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