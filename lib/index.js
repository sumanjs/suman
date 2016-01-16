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

//#core
//var Promise = require('bluebird');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var cp = require('child_process');
var makeSuman = require('./suman');
var appRootPath = require('app-root-path');
var EE = require('events');
var tcpp = require('tcp-ping');
var socketio = require('socket.io-client');

//#local
var SumanErrors = require('../config/suman-errors');
var handleUncaughtExceptions = require('./handle-uncaught-exception')();
var findSumanServer = require('./find-suman-server');
var ascii = require('./ascii');

var ansi = require('ansi-styles');

var a8b = require('ansi-8-bit'), fg = a8b.fg, bg = a8b.bg;

function Runner(obj) {

    var $NODE_ENV = obj.$node_env;
    var fileOrDir = obj.fileOrDir;
    var configPath = obj.configPath;
    var sumanGroup = obj.sumanGroup;
    var runOutputInNewTerminalWindow = obj.runOutputInNewTerminalWindow;

    if (fileOrDir && sumanGroup) {
        throw new Error('both fileOrDir and sumanGroup arguments passed, please choose one option only.');
    }


    var ee = new EE();

    try {

        var runnerPath = path.resolve(__dirname + '/runner');

        var args = ['--cfg', configPath];

        if (fileOrDir) {
            fileOrDir = path.resolve(appRootPath + '/' + fileOrDir);
            args.push('--pth');
            args.push(fileOrDir);
        }
        else if (sumanGroup) {
            try {
                if (typeof sumanGroup === 'string') {
                    sumanGroup = require(path.resolve(appRootPath + '/' + sumanGroup));
                }

                sumanGroup = JSON.stringify(sumanGroup);
                args.push('--sg');
                args.push(sumanGroup);
            }
            catch (err) {
                throw err;
            }
        }
        else {
            throw new Error('no fileOrDir and sumanGroup arguments passed, please pass at least one option.');
        }

        if (runOutputInNewTerminalWindow) {


            var n = cp.fork(runnerPath, args, {
                cwd: path.resolve(__dirname),
                detached: true,
                silent: true
                //env: {
                //    NODE_ENV: $NODE_ENV || process.env.NODE_ENV
                //}
            });

            n.stdout.setEncoding('utf8');

            /*
             Event: 'close'
             Event: 'disconnect'
             Event: 'error'
             Event: 'exit'
             Event: 'message'
             */

            n.on('error', function (err) {
                console.error(err.stack);
                ee.emit('error', err);
            });

            n.on('message', function (msg) {
                ee.emit('message', msg);
            });

            n.on('uncaughtException', function (err) {
                console.error(err.stack);
                ee.emit('error', err);
            });


            n.on('exit', function (msg) {
                ee.emit('exit', msg);
            });

            n.stderr.on('data', (data) => {
                ee.emit('error', data);
            });

            n.stdout.on('data', (data) => {
                ee.emit('data', data);
            });

        }
        else {
            var testRunner = require('./runner');
            testRunner(fileOrDir, 'suman.conf.js', sumanGroup);
            setImmediate(function () {
                ee.emit('exit');
            });
        }
    }
    catch (err) {
        console.error(err.stack);
    }

    return ee;

}


function Server(obj) {

    obj = obj || {};
    var $NODE_ENV = obj.$node_env;
    var sumanConfig = obj.configPath ? require(path.resolve(appRootPath + '/' + obj.configPath)) : null;
    var serverName = obj.serverName;

    var server = findSumanServer(sumanConfig,serverName);

    var timedout = null;

    var to = setTimeout(function () {
        if (timedout === null) {
            timedout = true;
            ee.emit('msg', 'timeout');
        }
    }, 5000);

    var socket;
    var ee = new EE();

    tcpp.probe(server.host, server.port, function (err, available) {
        if (err) {
            console.error(err.stack);
            ee.emit('error', err);
        }
        else if (available) {
            timedout = false;
            ee.emit('msg', '(suman server already running)');
        }
        else {
            try {
                var n, file;
                if (os.platform() === 'win32') {
                    file = path.resolve(__dirname + '/../server/start-server.bat');
                    n = cp.exec(file, [], {
                        detached: true,
                        env: {
                            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
                        }
                    });
                }
                else {
                    file = path.resolve(__dirname + '/../server/start-server.sh');
                    n = cp.spawn('sh', [file], {
                        //cwd: path.resolve(__dirname), //<<<<<<<<
                        detached: true,
                        env: {
                            NODE_ENV: process.env.NODE_ENV
                        }
                    });
                }

                //n.disconnect();
                //n.close();
                //process.disconnect();
                //n.unref();

                socket = socketio('http://' + server.host + ':' + server.port);

                socket.on('message', function (msg) {
                    timedout = false;
                    clearTimeout(to);
                    ee.emit('msg', msg);
                });

                n.on('error', function (err) {
                    ee.emit('error', err);
                });

                n.on('message', function (msg) {
                    timedout = false;
                    clearTimeout(to);
                    ee.emit('msg', msg);
                });

            }
            catch (err) {
                console.error(err.stack);
                ee.emit('error', err);
            }
        }
    });

    return ee;
}


function Test($module, configPath) {

    if (this instanceof Test) {
        console.log('warning: no need to use "new" keyword with Test function as it is not a standard constructor');
        return Test($module, configPath);
    }

    return {

        describe: function (desc, opts, cb) {

            makeSuman($module, configPath, function (err, suman) {
                if (err) {
                    console.error(err.stack);
                }
                else {

                    //console.log(ansi.bgBlue.open + ascii.suman_slant + ansi.bgBlue.close);


                    console.log(fg.getRgb(12,23,24) + bg.getRgb(34,34,34) + ascii.suman_slant + a8b.reset);
                    //
                    //console.log(fg.getRgb(42,53,44) + bg.getRgb(4,44,44) + 'Hello world!' + a8b.reset);
                    var run = require('./run').main(suman);
                    setImmediate(function () {  //so that multiple tests can be referenced in the same file
                        run(desc, opts, cb);
                    });
                }
            });

        }
    }

}


var constants = require('../config/suman-constants');

module.exports = {
    Test: Test,
    Runner: Runner,
    Server: Server,
    constants: constants
};

