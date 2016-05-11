/***
 * Created by denman on 11/24/15.
 */


/////////////////////////////////////////////////////////////////////

const weAreDebugging = require('./debugging-helper/we-are-debugging');

//////////////////////////////////////////////////////////////////////

//#core
const domain = require('domain');
const os = require('os');
const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const EE = require('events');
const stream = require('stream');
const util = require('util');
const fs = require('fs');

//#npm
const stack = require('callsite');
const _ = require('underscore');
const tcpp = require('tcp-ping');
const socketio = require('socket.io-client');
const colors = require('colors/safe');

//#project
const makeSuman = require('./suman');
const SumanErrors = require('../config/suman-errors');
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');
const ansi = require('ansi-styles');
const sumanUtils = require('./utils');
const constants = require('../config/suman-constants');
const acquireDeps = require('./acquire-deps');
const makeHandleUncaughtException = require('./handle-uncaught-exception');


function Runner(obj) {

    const cwd = process.cwd();
    const projRoot = sumanUtils.findProjectRoot(cwd);

    const $NODE_ENV = obj.$node_env;
    const grepFile = obj.grepFile;
    const fileOrDir = obj.fileOrDir;
    //const $configPath = obj.configPath;
    const sumanGroup = obj.sumanGroup;
    const runOutputInNewTerminalWindow = obj.runOutputInNewTerminalWindow;

    if (!fileOrDir && !sumanGroup) {
        throw new Error('need to choose either fileOrDir and sumanGroup as arguments.');
    }

    if (fileOrDir && sumanGroup) {
        throw new Error('both fileOrDir and sumanGroup arguments passed, please choose one option only.');
    }

    /*

     // for now assume config has been loaded by index.js

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
     configPath = path.resolve(projRoot + '/suman.conf.js');
     config = require(path.resolve(configPath)); //TODO need to fix this
     }
     }
     catch (err) {
     throw new Error('Cannot find the config file based off the path provided by you: "' + configPath + '"');
     }
     }*/


    const ee = new EE();

    global.sumanOpts.__maxParallelProcesses = sumanOpts.processes || global.sumanConfig.maxParallelProcesses;


    const runnerPath = path.resolve(__dirname + '/runner');

    const $config = JSON.stringify(global.sumanConfig);
    const args = ['--cfg', $config];

    if (fileOrDir) {
        args.push('--pth');
        args.push(fileOrDir);
    }
    else if (sumanGroup) {
        try {
            if (typeof sumanGroup === 'string') {
                // sumanGroup = require(path.resolve(appRootPath + '/' + sumanGroup));   //TODO
            }

            const $sumanGroup = JSON.stringify(sumanGroup);
            args.push('--sg');
            args.push($sumanGroup);
        }
        catch (err) {
            throw err; //for now just throw the error
        }
    }
    else {
        throw new Error('no fileOrDir and sumanGroup arguments passed, please pass at least one option.');
    }

    const strmPath = path.resolve(projRoot + '/suman/logs/runner-stderr.log');
    const strm = global.sumanStderrStream = fs.createWriteStream(strmPath);
    strm.write('\n\n>>> Suman runner start >>>\n');
    strm.write('Beggining of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
    strm.write('Command issued from the following directory "' + cwd + '"\n');
    strm.write('Command = ' + JSON.stringify(process.argv) + '\n');

    /////////////// validate suman.once.js //////////////////////////////////////////////////////////
    const oncePath = path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman/suman.once.js');

    var runOnce = null;

    try {
        runOnce = require(oncePath);
        assert(typeof runOnce === 'function', 'runOnce is not a function.');
    }
    catch (err) {
        if (err instanceof assert.AssertionError) {
            console.error('Your suman.once.js module is defined at the root of your project, but it does not export a function and/or return an object from that function.');
            return;
        }
    }

    runOnce = runOnce || function () {
            return {};
        };

    ////////////// validate suman.order.js ///////////////////////////////////////////////////////////
    const orderPath = path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman/suman.order.js');

    var fn, order = null;

    try {
        fn = require(orderPath);
        if (fn) {
            order = fn();
        }
    }
    catch (err) {
        if (fn) {
            throw new Error('Your suman.order.js file needs to export a function.');
        }
        else {
            console.error(' => Suman warning => Your suman.order.js file could not be located at ./suman/suman.order.js');
        }
    }

    if (order) {
        require('./input-validation/validate-suman.order')(order);  //will throw error if invalid, halting the program
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////

    sumanUtils.makeResultsDir(true, function (err) {

        if (err) {
            console.error(err);
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
            //dirs, $config, sumanGroup, grepFile, grepSuite, runOnce
            require('./runner')(fileOrDir, sumanGroup, grepFile, '*', runOnce, order);
            setImmediate(function () {
                ee.emit('exit');
            });
        }

    });

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
        var defaultConfig = require(path.resolve(__dirname + '/../default-conf-files/suman.default.conf.js'));
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
            ee.emit('SUMAN_SERVER_MSG', '(suman server already running)');
        }
        else {
            try {
                var n, file;
                if (os.platform() === 'win32') {
                    file = path.resolve(__dirname + '/../server/start-server.bat');
                    n = cp.exec(file, [], {
                        detached: false,
                        env: {
                            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
                        }
                    });
                }
                else {
                    //TODO: configure 'open' command to use bash instead of Xcode

                    // file = path.resolve(__dirname + '/../server/start-server2.sh');
                    // n = cp.spawn('sh', [file], {
                    //     //cwd: path.resolve(__dirname), // <<<
                    //     detached: false,
                    //     env: {
                    //         NODE_ENV: process.env.NODE_ENV
                    //     }
                    // });

                    file = path.resolve(__dirname + '/../server/bin/www');

                    // n = cp.exec('node ' + file + ' &', function (err, stdout, stderr) {
                    //     if (err) {
                    //         console.error(err);
                    //     }
                    //     if (String(stdout.match(/Error/i)) || String(stderr).match(/Error/)) {
                    //         console.error('stdout:', stdout, '\n', 'stderr:', stderr);
                    //     }
                    // });

                    n = cp.spawn('node', [file], {
                        detached: false
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
                    ee.emit('SUMAN_SERVER_MSG', msg);
                });

                n.on('error', function (err) {
                    ee.emit('error', err);
                });

                n.on('message', function (msg) {
                    timedout = false;
                    clearTimeout(to);
                    ee.emit('SUMAN_SERVER_MSG', msg);
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


function init($module, $opts) {

    ///////////////////////////////////
    debugger;  // leave this here forever for debugging child processes
    //////////////////////////////////

    if (this instanceof init) {
        console.log('Warning: no need to use "new" keyword with the suman init function as it is not a standard constructor');
        return init.apply(this, arguments);
    }

    if (init.$ingletonian) {
        return init.$ingletonian;
    }

    const index = process.argv.indexOf('--sumanOpts');
    const sumanOptsFromRunner = index > -1 ? JSON.parse(process.argv[index + 1]) : {};
    global.sumanOpts = global.sumanOpts || sumanOptsFromRunner;
    const usingRunner = global.usingRunner = process.argv.indexOf('--$runner') > -1;

    const main = require.main.filename;
    var matches = false;
    stack().forEach(function (site, index) {
        if (index < 6) {
            const fileName = site.getFileName();
            // console.log('fileName:',fileName);
            if (String(fileName) === String(main)) {
                matches = true;
            }
        }
    });

    // console.log('main:',main);
    // console.log('matches:',matches);


    const cwd = process.cwd();
    const projRoot = sumanUtils.findProjectRoot(cwd);

    const opts = $opts || {};
    const configPath = opts.configPath;
    const integrants = opts.integrants || [];
    const _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    const exportTests = opts.export === true;
    const writable = opts.writable || null;
    const iocData = opts.iocData || null;

    if (iocData) {
        try {
            assert(typeof iocData === 'object' && !Array.isArray(iocData)); //make sure it's an object {}
        }
        catch (err) {
            console.error(err.stack);
            process.exit(constants.EXIT_CODES.IOC_PASSED_TO_SUMAN_INIT_BAD_FORM);
        }
    }

    global.resultBroadcaster = global.resultBroadcaster || new EE();
    global.sumanReporters = global.sumanReporters || [];
    //TODO: probably don't need to store reporters in array, at all
    if (global.sumanReporters.length < 1) {
        const fn = require(path.resolve(__dirname + '/reporters/std-reporter'));
        assert(typeof fn === 'function', 'Native reporter fail.');
        global.sumanReporters.push(fn);
        fn.apply(global, [global.resultBroadcaster]);
    }

    //TODO: verify that writable is actually a proper writable stream
    const sumanEvents = $module.exports = writable || Transform();


    if (exportTests) {
        //TODO: if export is set to true, then we need to exit if we are using the runner
        console.log(colors.magenta(' => Suman message => export option set to true.'));
    }

    //TODO: need to validate integrants is array etc.
    global.Promise = global.Promise || require('bluebird');
    $module.exports.tests = $module.exports.tests || [];

    //////////////////////////////////////////////////////////////////

    var config, pth1, pth2;

    //TODO: config is also being serialized to JSON, so we could read that instead
    if (!(config = global.sumanConfig)) {
        try {
            pth1 = path.resolve(path.normalize(cwd + '/' + configPath));
            config = require(pth1); //TODO: allow for command line input of configPath
        }
        catch (err) {
            try {
                pth1 = null;  //force null for logging below
                pth2 = path.resolve(path.normalize(projRoot + '/suman.conf.js')); //this fails when
                config = require(pth2); //TODO: allow for command line input of configPath
            }
            catch (err) {
                pth2 = null;
                console.log(' => Suman message => could not resolve path to config file either in your current working directory or at the root of your project.');
                console.log(colors.bgCyan.white(' => Suman message => Using default Suman configuration.'));

                try {
                    var pth = path.resolve(__dirname + '/../default-conf-files/suman.default.conf.js');
                    config = require(pth);
                    //if (config.verbose !== false) {  //default to true
                    //    console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
                    //}
                }
                catch (err) {
                    console.error('\n => ' + err.stack + '\n');
                    process.exit(constants.EXIT_CODES.COULD_NOT_FIND_CONFIG_FROM_PATH);
                    return;
                }
            }
        }


        global.sumanConfig = config;
        const pkgJSON = require('../package.json');
        const v = pkgJSON.version;
        console.log(colors.gray.italic(' => Suman v' + v + ' running individual test suite...'));
        console.log(' => cwd: ' + cwd);
        if (pth1 || pth2) {
            console.log(' => Suman config used: ' + (pth1 || pth2), '\n');
        }
    }

    if (usingRunner) {
        global._writeError = function () {
            process.stderr.write.apply(process.stderr, arguments);  //goes to runner
        };
        global._writeLog = function () {
            // use process.send to send data to runner? or no-op
        }
    }
    else {

        const strmStdoutPath = global.testStderrStrmPath = path.resolve(projRoot + '/suman/logs/test-stdout.log');
        const strmStdout = fs.createWriteStream(strmStdoutPath, {flags: 'w'});

        global._writeLog = function () {
            strmStdout.write.apply(strmStdout, arguments);
        };

        const strmPath = global.testStderrStrmPath = path.resolve(projRoot + '/suman/logs/test-stderr.log');
        const strm = fs.createWriteStream(strmPath, {flags: 'w'});

        global._writeError = function () {
            global.checkTestErrorLog = true;
            strm.write.apply(strm, arguments);
        };
        global._writeError('\n\n>>> Suman start run indiv. @' + new Date() + ' >>>\n\n');
        global._writeError('Beginning of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
        global._writeError('Command = ' + JSON.stringify(process.argv) + '\n');
    }

    console.log(ascii.suman_slant);
    process.stdout.write('\n');

    ////////////////////////////////////////////////////////////////

    const blocked = process.argv.indexOf('--blocked') > -1;

    var exec = function () {
        // function may be redefined below
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
            process.nextTick(cb);
        }
    }
    else if (typeof process.send === 'function') {

        integrantsFn = function (cb) {

            const integrantsFromParentProcess = [];

            if (integrantsReady) {
                process.nextTick(cb);
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

                process.send({type: constants.runner_message_type.INTEGRANT_INFO, msg: integrants});
            }
        }
    }
    else {
        integrantsFn = function (cb) {

            //TODO: if multiple test files are reference in project and it is run without the runner,
            // we need to check if integrants are already ready

            var integPath;
            try {
                integPath = require(path.resolve(sumanUtils.findProjectRoot(cwd) + '/suman/suman.once.js'));
                assert(typeof integPath === 'function', 'Your suman.once.js file needs to export a function.');
            }
            catch (err) {
                console.log('=> Suman error: no suman.once.js file found at root of your project');
                return process.nextTick(function () {
                    cb(err);
                });
            }

            const depContainerObj = integPath();
            const d = domain.create();

            d.once('error', function (err) {
                err = new Error(' => Suman fatal error => there was a problem verifying the integrants listed in test file "' + $module.filename + '"\n' + err.stack);
                if (process.send) {
                    process.send({
                        type: constants.runner_message_type.FATAL,
                        data: {
                            msg: err.stack,
                            stack: err.stack
                        }
                    });
                }

                global._writeError(err.stack);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
            });

            d.run(function () {
                process.nextTick(function () {
                    acquireDeps(integrants, depContainerObj, sumanUtils.once(global, function (err, result) {
                        cb(err, result);
                    }));
                });
            });
        }
    }

    function start() {

        const args = Array.prototype.slice.call(arguments);

        integrantsFn(function (err) {
            if (err) {
                global._writeError(err.stack);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
            }
            else {
                //TODO: need to properly toggle boolean that determines whether or not to try to create dir
                makeSuman($module, _interface, true, config, function (err, suman) {

                    if (err) {
                        global._writeError(err.stack);
                        process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
                    }
                    else {
                        if (exportTests && matches) {

                            const $code = constants.EXIT_CODES.EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY;

                            if (usingRunner) {
                                suman.logFinished($code);
                            }
                            else {
                                global._writeError(' => Suman error => You have declared export:true in your suman.init call, but ran the test directly.');
                            }

                            setImmediate(function () {
                                console.log('\n\n => Suman exiting with code: ', $code, '\n\n');
                                process.exit($code);
                            });
                        }
                        else {

                            const run = require('./exec-suite').main(suman);

                            setImmediate(function () {  // important: allows for future possibility of multiple test suites referenced in the same file
                                if (exportTests === true) { //TODO: if we use this, need to make work with integrants/blocked etc.

                                    $module.exports.tests.push(function ($argz) {
                                        run.apply(global, args.concat($argz));
                                    });

                                    sumanEvents.emit('test', function () {
                                        const argz = Array.prototype.slice.call(arguments);
                                        args.push(argz);
                                        run.apply(global, args);
                                    });

                                    //TODO: just need to flip a boolean flag if it's already ready
                                    /*   sumanEvents.on('finish', function () {
                                     run.apply(global, args);
                                     });
                                     if (sumanEvents.finished) {
                                     run.apply(global, args);
                                     }*/

                                    if (writable) {
                                        args.push([]); // [] is empty array representing extra/ $uda
                                        args.push(writable);
                                        run.apply(global, args);
                                    }

                                }
                                else if (unblocked === false) {
                                    exec = function () {
                                        run.apply(global, args);
                                    };
                                }
                                else {  //if  unblocked === true or if unblocked === null etc
                                    args.push([]);  // [] is empty array representing extra/ $uda
                                    args.push(writable || null);
                                    args.push(iocData || null);
                                    run.apply(global, args);  //args are most likely (desc,opts,cb)
                                }
                            });
                        }

                    }

                });
            }

        });
    }

    start.skip = start.SKIP = function () {
        //TODO: do some process.exit stuff here
        process.exit(constants.EXIT_CODES.WHOLE_TEST_SUITE_SKIPPED);
    };

    start.only = start.ONLY = start;

    init.$ingletonian = {
        parent: $module.parent, //parent is who required the original $module
        file: $module.filename
    };

    _interface === 'TDD' ? init.$ingletonian.suite = start : init.$ingletonian.describe = start;
    return init.$ingletonian;
}


function Writable(type) {

    if (this instanceof Writable) {
        return Writable.apply(global, arguments);
    }

    //type: duplex, transform etc

    const strm = new stream.Writable({
        write: function (chunk, encoding, cb) {
            console.log('index chunks:', String(chunk));
        }
    });
    // strm.cork();

    return strm;

}


//TODO: https://gist.github.com/PaulMougel/7961469

function Transform(obj) {

    //TODO: http://stackoverflow.com/questions/10355856/how-to-append-binary-data-to-a-buffer-in-node-js

    // const strm = new stream.Transform({
    //
    //     transform: function (chunk, encoding, cb) {
    //
    //         var data = chunk.toString();
    //         if (this._lastLineData) {
    //             data = this._lastLineData + data;
    //         }
    //
    //         console.log('data:', data);
    //
    //         var lines = data.split('\n');
    //         this._lastLineData = lines.splice(lines.length - 1, 1)[0];
    //
    //         lines.forEach(this.push.bind(this));
    //         cb();
    //     }
    // });


    var BufferStream = function () {
        stream.Transform.apply(this, arguments);
        this.buffer = [];
    };

    util.inherits(BufferStream, stream.Transform);

    BufferStream.prototype._transform = function (chunk, encoding, done) {
        // custom buffering logic
        // ie. add chunk to this.buffer, check buffer size, etc.

        this.push(chunk ? String(chunk) : null);
        this.buffer.push(chunk ? String(chunk) : null);

        done();
    };

    BufferStream.prototype.pipe = function (destination, options) {
        var res = stream.Transform.prototype.pipe.apply(this, arguments);
        this.buffer.forEach(function (b) {
            res.write(String(b));
        });
        return res;
    };

    // strm.cork();
    return new BufferStream();


}

function autoPass() {

}

function autoFail() {
    throw new Error('auto-fail error');
}

module.exports = {
    autoPass: autoPass,
    autoFail: autoFail,
    init: init,
    Runner: Runner,
    Server: Server,
    constants: constants,
    Writable: Writable,
    Transform: Transform
};
