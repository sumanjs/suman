/**
 * Created by amills001c on 11/24/15.
 */


/* advantages of Suman
 *
 * better than mocha, cleaner than vows
 * no globals - no global NPM module - no global variables
 * test suites each run in separate process for speed and correctness
 * each test suite can have parallel components, allowing the developer to run tests serially, in parallel or in combination, as the developer sees fit
 * code inside any test will not run for any test not intended to run when using grep features
 * organize your tests depending on NODE_ENV or command line flags using config files, instead of putting tests in different top-level folders in your project
 *  asynchronous reporting capablities - write test results to DB
 *
 * */



//TODO: need to check to make sure the tests have different names, before running
//note: https://www.npmjs.com/package/gulp-mocha


//var Promise = require('bluebird');
var appRootPath = require('app-root-path');
var path = require('path');
var _ = require('underscore');
var cp = require('child_process');
var makeSuman = require('./suman');


function Runner(obj) {

    var $NODE_ENV = obj.$node_env;
    var fileOrDir = obj.fileOrDir;
    var configPath = obj.configPath;

    var runnerPath = path.resolve(__dirname + '/runner');

    var n = cp.fork(runnerPath, ['--pth', fileOrDir, '--cfg', configPath], {
        detached: false,
        env: {
            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
        }
    });

    n.unref();
    return n;
}


function Server(obj) {

    obj = obj || {};
    var $NODE_ENV = obj.$node_env;

    var serverPath = path.resolve(__dirname + '/../bin/www');

    var n = cp.fork(serverPath, [], {
        detached: true,
        env: {
            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
        }
    });

    n.unref();
    return n;

}



function Test($module, configPath) {

        if (this instanceof Test) {
        console.log('warning: no need to use "new" keyword with Test function as it is not a standard constructor');
            return Test($module, configPath);
        }

        return {

            new: function (desc, cb) {

                //process.stdin.resume();

                var suman = makeSuman($module, configPath);
                var run = require('./run').main(suman);
                run(desc, cb);

            }
        }

}


module.exports = {
    //given: given,
    Test: Test,
    Runner: Runner,
    Server: Server
};

