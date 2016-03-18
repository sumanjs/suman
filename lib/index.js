/**
 * Created by denman on 11/24/15.
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

//TODO: move to lodash, ditch underscore
//TODO: use fs.createReadStream to check files to see if they are actually Suman tests
//TODO: if the user wants to see clean output, go to the web browser, the console is for quick and dirty output, including debugging/console.log output
//TODO: runner and reporter can filter out debugging output, whilst running single test will output debugging stuff
//TODO: need to check to make sure the tests have different names, before running
//TODO: note: https://www.npmjs.com/package/gulp-mocha


//#core
const domain = require('domain');
const os = require('os');
const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const EE = require('events');

//#npm
const _ = require('underscore');
const appRootPath = require('app-root-path');
const tcpp = require('tcp-ping');
const socketio = require('socket.io-client');

//#project
const makeSuman = require('./suman');
const SumanErrors = require('../config/suman-errors');
const handleUncaughtExceptions = require('./handle-uncaught-exception')();
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');
const ansi = require('ansi-styles');
const sumanUtils = require('./utils');
const constants = require('../config/suman-constants');
const acquireDeps = require('./acquire-deps');


function Runner(obj) {

    var cwd = process.cwd();

    var $NODE_ENV = obj.$node_env;
    var grepFile = obj.grepFile;
    var fileOrDir = obj.fileOrDir;
    var config = obj.config;
    var $configPath = obj.configPath;
    var sumanGroup = obj.sumanGroup;
    var runOutputInNewTerminalWindow = obj.runOutputInNewTerminalWindow;

    if (!fileOrDir && !sumanGroup) {
        throw new Error('need to choose either fileOrDir and sumanGroup as arguments.');
    }

    if (fileOrDir && sumanGroup) {
        throw new Error('both fileOrDir and sumanGroup arguments passed, please choose one option only.');
    }

    var configPath;

    try {
        if (typeof config !== 'object') {
            configPath = $configPath || path.resolve(cwd + '/suman.conf.js');
            config = require(path.resolve(configPath)); //TODO need to fix this
        }
    }
    catch (err) {
        try {
            if (typeof config !== 'object') {
                configPath = path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman.conf.js');
                config = require(path.resolve(configPath)); //TODO need to fix this
            }
        }
        catch (err) {
            throw new Error('Cannot find the config file based off the path provided by you: "' + configPath + '"');
        }
    }

    var ee = new EE();

    try {

        var runnerPath = path.resolve(__dirname + '/runner');

        var $config = JSON.stringify(config);
        var args = ['--cfg', $config];

        if (fileOrDir) {
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

        /////////////// validate suman.once.js //////////////////////////////////////////////////////////

        const oncePath = path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman.once.js');

        var runOnce = null;

        try {
            runOnce = require(oncePath);
            runOnce = runOnce || null;
            assert(typeof runOnce === 'function', 'runOnce is not a function.');
        }
        catch (err) {
            if (err instanceof AssertionError) {
                console.error('Your suman.once.js module is defined at the root of your project, but it does not export a function and/or return an object from that function.')
                return;
            }
        }

        runOnce = runOnce || function () {
                return {};
            };

        ////////////// validate suman.order.js ///////////////////////////////////////////////////////////


        const orderPath = path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman.order.js');

        var fn, order = null;

        try {
            fn = require(orderPath);
            if (fn) {
                order = fn();
            }
        }
        catch (err) {
            if (fn) {
                throw new Error('Your suman.order.js file needs to export a function.')
            }
        }

        if (order) {
            require('./input-validation/validate-suman.order')(order);  //will throw error if invalid, halting the program
        }


        //////////////////////////////////////////////////////////////////////////////////////////////////

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
            //dirs, $config, sumanGroup, grepFile, grepSuite, runOnce
            require('./runner')(fileOrDir, config, sumanGroup, grepFile, '*', runOnce, order);
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
    var cwd = process.cwd();
    var $NODE_ENV = obj.$node_env;
    var sumanConfig;
    if (typeof obj.config === 'object') {   //TODO: do at least one more check here
        sumanConfig = obj.config;
    }
    else {
        sumanConfig = obj.configPath ? require(path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + obj.configPath)) : null;
    }

    var serverName = obj.serverName;
    var server = findSumanServer(sumanConfig, serverName);


    if (server == null) {
        var defaultConfig = require(path.resolve(__dirname + '/../suman.default.conf.js'));
        server = defaultConfig.servers['*default'];
    }

    assert(server.host, 'No server host.');
    assert(server.port, 'No server port.');

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
            clearTimeout(to);
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
                        //cwd: path.resolve(__dirname), // <<<
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


////////////////////////////
var $describe = null;   // our singletonian
///////////////////////////

function init($module, $opts) {

    //TODO: need to handle case where unblock happens before integrants finish

    if (this instanceof init) {
        console.log('Warning: no need to use "new" keyword with the suman init function as it uses closures, and is not a standard constructor');
        return init.apply(this, arguments);
    }

    if ($describe) {
        return $describe;
    }

    const cwd = process.cwd();
    const opts = $opts || {};
    const configPath = opts.configPath;
    const integrants = opts.integrants || [];

    global.Promise = global.Promise || require('bluebird');
    $module.exports.tests = $module.exports.tests || [];

    const blocked = process.argv.indexOf('--blocked') > -1;

    var exec = function(){
        // function to be redefined below
    };

    var unblocked = null;
    if (blocked) {
        unblocked = false;
        process.on('message', function (data) {
            if (data.unblocked === true) {
                unblocked = true;
                exec();
            }
        });
    }

    var integrantsFn = null;
    var integrantsReady = false;

    if (integrants.length < 1) {
        integrantsFn = function (cb) {
            cb(null);
        }
    }
    else if (typeof process.send === 'function') {

        process.send({type: 'INTEGRANT_INFO', msg: integrants});
        var integrantsFromParentProcess = [];

        integrantsFn = function (cb) {
            if (integrantsReady) {
                cb(null);
            }
            else {
                process.on('message', function (msg) {
                    if (msg.info === 'integrant-ready') {
                        integrantsFromParentProcess.push(msg.data);
                        if (sumanUtils.checkForEquality(integrants, integrantsFromParentProcess)) {
                            integrantsReady = true;
                            cb(null);
                        }
                    }
                    else if (msg.info === 'integrant-error') {
                        cb([msg.data]);
                    }
                });
            }
        }
    }
    else {
        integrantsFn = function (cb) {

            var integPath;
            try {
                integPath = require(sumanUtils.findProjectRoot(cwd) + '/suman.once.js');
                assert(typeof integPath === 'function', 'Your suman.once.js file needs to export a function.');
            }
            catch (err) {
                console.log('=> Suman error: no suman.once.js file found at root of your project');
                return cb(err);
            }

            const depContainerObj = integPath();

            const d = domain.create();

            d.once('error', function (err) {
                err = new Error('=> Suman fatal error => there was a problem verifying the integrants listed in test file "' + $module.filename + '"\n' + err.stack);
                if (process.send) {
                    process.send({msg: err, stack: err, type: 'FATAL', fatal: true});
                }
                throw err;
                setImmediate(function(){
                    process.exit(1);
                });
            });

            d.run(function () {
                acquireDeps(integrants, depContainerObj, sumanUtils.once(global, function (err, result) {
                    cb(err, result);
                }));
            });

        }
    }

    return $describe = {

        describe: function () {

            var args = arguments;

            integrantsFn(function (err) {
                if (err) {
                    console.error(err.stack);
                }
                else {
                    makeSuman($module, configPath, function (err, suman) {

                        if (err) {
                            console.error(err.stack);
                        }

                        var run = require('./exec-suite').main(suman);

                        setImmediate(function () {  //so that multiple tests can be referenced in the same file
                            if ($module.exports.wait === true) {
                                $module.exports.tests.push(function () {
                                    run.apply(global, args);
                                });
                            }
                            else if( unblocked === false){
                                exec = function () {
                                    run.apply(global, args);
                                };
                            }
                            else {  //if  unblocked === true or if unblocked === null etc
                                run.apply(global, args);  //args are most likely (desc,opts,deps,cb)
                            }
                        });
                    });
                }

            });
        }
    }
}


module.exports = {
    init: init,
    Runner: Runner,
    Server: Server,
    constants: constants
};
