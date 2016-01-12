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
 *  3 reasons to use nested describes?
 *  (1) to control parallel flow - nesting in describe can force to run in series
 *  (2) skip/only - allow you to skip whole sections of a test suite
 *  (3) labelling of output - nesting in describes allows you to label and organize the output from your tests
 *
 * */



//TODO: need to check to make sure the tests have different names, before running
//note: https://www.npmjs.com/package/gulp-mocha


//var Promise = require('bluebird');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var cp = require('child_process');
var makeSuman = require('./suman');
var appRootPath = require('app-root-path');


function Runner(obj) {

    var $NODE_ENV = obj.$node_env;
    var fileOrDir = obj.fileOrDir;
    var configPath = obj.configPath;
    var sumanGroup = obj.sumanGroup;

    if(fileOrDir && sumanGroup){
        throw new Error('both fileOrDir and sumanGroup arguments passed, please choose one option only.');
    }

    var runnerPath = path.resolve(__dirname + '/runner');

    var args = ['--cfg', configPath];

    if(fileOrDir){
        args.concat('--pth').concat(fileOrDir);
    }
    else if(sumanGroup){
        try{
            if(typeof sumanGroup === 'string'){
                sumanGroup = require(path.resolve(appRootPath + '/' + sumanGroup));
            }

            sumanGroup = JSON.stringify(sumanGroup);
            args.concat('--sg').concat(sumanGroup);
        }
        catch(err){
            throw err;
        }
    }
    else{
        throw new Error('no fileOrDir and sumanGroup arguments passed, please pass at least one option.');
    }

    var n = cp.fork(runnerPath, args, {
        detached: true,
        env: {
            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
        }
        //silent:true
    });

    //n.stdio.on('data', function(data) {
    //    console.log('data from child process:',data);
    //});
    //
    //n.stdio.pipe(process.stdout);
    //n.stderr.pipe(process.stderr);

    n.unref();
    return n;
}


/*function Server(obj) {

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

 }*/


function Server(obj) {

    obj = obj || {};
    var $NODE_ENV = obj.$node_env;

    if (os.platform() === 'win32') {
        var n = cp.exec('start-server.bat', [], {
            detached: true,
            env: {
                NODE_ENV: $NODE_ENV || process.env.NODE_ENV
            }
        });
    }
    else {
        var n = cp.spawn('sh', [ 'start-server.sh' ], {
            cwd: path.resolve(__dirname + '/../'),
            detached: true,
            env: {
                NODE_ENV: process.env.NODE_ENV
            }
        });

    }

    //n.disconnect();
    //n.close();
    //process.disconnect();
    n.unref();
    return n;

}


function Test($module, configPath) {

    if (this instanceof Test) {
        console.log('warning: no need to use "new" keyword with Test function as it is not a standard constructor');
        return Test($module, configPath);
    }

    return {

        describe: function (desc, opts, cb) {

            makeSuman($module, configPath, function(err, suman){
                if(err){
                    console.error(err.stack);
                }
                else{
                    var run = require('./run').main(suman);
                    setImmediate(function () {  //so that multiple tests can be referenced in the same file
                        run(desc, opts, cb);
                    });
                }
            });

        }
    }

}


module.exports = {
    //given: given,
    Test: Test,
    Runner: Runner,
    Server: Server
};

