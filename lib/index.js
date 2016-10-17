'use strict';


function sendFatalMessageToRunner(msg) {
    if (global.usingRunner) {
        //TODO: this is not necessarily fatal
        process.send({
            type: constants.runner_message_type.FATAL,
            data: {
                error: msg,
                msg: msg
            }
        });
    }

}

process.on('uncaughtException', function (err) {

    const msg = err.stack || err;

    if (process.listenerCount('uncaughtException') < 2) {
        console.error('\n\n => Suman uncaught exception => ', msg);
    }

    if (String(msg).match(/.suite is not a function/i)) {
        process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
            '\n\tsee oresoftware.github.io/suman\n\n');
    }
    else if (String(msg).match(/.describe is not a function/i)) {
        process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
            '\n\tsee oresoftware.github.io/suman\n\n');
    }

    sendFatalMessageToRunner(msg);
});

process.on('unhandledRejection', (reason, p) => {
    reason = (reason.stack || reason);
    console.error('Unhandled Rejection at: Promise ', p, ' reason => ', reason, 'stack =>', reason);
    sendFatalMessageToRunner(reason);
});


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

//#project  //TODO: move these into init fn
const makeSuman = require('./suman');
const SumanErrors = require('../config/suman-errors');
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');
const ansi = require('ansi-styles');
const sumanUtils = require('./utils');
const constants = require('../config/suman-constants');
const acquireDeps = require('./acquire-deps');
// const makeHandleUncaughtException = require('./handle-uncaught-exception');

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

    const strmPath = path.resolve(global.sumanHelperDirRoot + '/logs/runner-debug.log');
    const strm = global.sumanStderrStream = fs.createWriteStream(strmPath);
    // const strmStdoutPath = path.resolve(global.sumanHelperDirRoot + '/logs/runner-stdout.log');
    // const strmStdout = global.sumanStdoutStream = fs.createWriteStream(strmStdoutPath);

    strm.write('\n\n### Suman runner start ###\n\n');
    strm.write('Beginning of run at ' + Date.now() + ' = [' + new Date() + ']' + '\n');
    strm.write('Command issued from the following directory "' + cwd + '"\n');
    strm.write('Command = ' + JSON.stringify(process.argv) + '\n');

    /////////////// validate suman.once.js //////////////////////////////////////////////////////////

    const oncePath = path.resolve(global.sumanHelperDirRoot + '/suman.once.js');

    var runOnce = null;

    try {
        runOnce = require(oncePath);
        assert(typeof runOnce === 'function', 'runOnce is not a function.');
    }
    catch (err) {
        if (err instanceof assert.AssertionError) {
            console.log('Your suman.once.js module is defined at the root of your project, but it does not export a function and/or return an object from that function.');
            return;
        }
    }

    runOnce = runOnce || function () {
            return {};
        };

    ////////////// validate suman.order.js ///////////////////////////////////////////////////////////
    const orderPath = path.resolve(global.sumanHelperDirRoot + '/suman.order.js');

    var fn, order = null;

    try {
        fn = require(orderPath);
        if (fn) {
            order = fn();
        }
    }
    catch (err) {
        if (fn) {
            throw new Error(' => Your suman.order.js file needs to export a function.');
        }
        else if (!global.usingDefaultConfig) {
            console.log(' => Suman warning => Your suman.order.js file could not be located,\n    ' +
                'given the suman.conf.js property value for sumanHelperDir => ' + global.sumanHelperDirRoot);
        }
    }

    if (order) {
        require('./input-validation/validate-suman.order')(order);  //will throw error if invalid, halting the program
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////

    sumanUtils.makeResultsDir(true, function (err) {

        if (err) {
            console.log(err.stack);
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
                console.log(err.stack);
                ee.emit('error', err);
            });

            n.on('message', function (msg) {
                ee.emit('message', msg);
            });

            n.on('uncaughtException', function (err) {
                console.log(err.stack);
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

function Server(obj, cb) {

    obj = obj || {};

    cb = cb || function (err) {
            if (err) {
                console.error(err.stack || err);
            }
        };

    const projectRoot = obj.root || sumanUtils.findProjectRoot(process.cwd());
    const $NODE_ENV = obj.$node_env;

    // const sumanExecutablePath = path.resolve(projectRoot + '/node_modules/.bin/suman');
    const sumanExecutablePath = path.resolve(__dirname, '..', 'index.js');

    var sumanConfig;
    if (typeof obj.config === 'object') {   //TODO: do at least one more check here
        sumanConfig = obj.config;
    }
    else {
        sumanConfig = obj.configPath ? require(path.resolve(projectRoot + '/' + obj.configPath)) : null;
    }

    var server = findSumanServer(obj.serverName);

    if (server == null) {
        var defaultConfig = require(path.resolve(__dirname + '/../default-conf-files/suman.default.conf.js'));
        server = defaultConfig.servers['*default'];
    }

    assert(server.host, 'No server host.');
    assert(server.port, 'No server port.');

    const ret = {
        host: server.host,
        port: server.port,
        alreadyLive: null
    };

    tcpp.probe(server.host, server.port, function (err, available) {

        if (err) {
            console.log('tcpp probe error:', err.stack || err);
            return cb(err, ret);
        }

        ret.alreadyLive = !!available;

        if (available) {
            if (global.sumanOpts.verbose) {
                console.log('\n', ' => Suman server is already live.', '\n');
            }

            cb(null, ret);
        }
        else {

            const sumanCombinedOpts = JSON.stringify({
                sumanMatches: global.sumanMatches,
                sumanNotMatches: global.sumanNotMatches,
                sumanHelperDirRoot: global.sumanHelperDirRoot,
                verbose: global.sumanOpts.verbose,
                vverbose: global.sumanOpts.vverbose
            });

            var n, file;
            if (os.platform() === 'win32') {
                file = path.resolve(__dirname + '/../server/start-server.bat');
                n = cp.exec(file, [], {
                    detached: false,
                    env: Object.assign({}, process.env, {
                        SUMAN_SERVER_OPTS: sumanCombinedOpts,
                        NODE_ENV: $NODE_ENV || process.env.NODE_ENV,
                        SUMAN_CONFIG: JSON.stringify(sumanConfig),
                        SUMAN_PROJECT_ROOT: projectRoot,
                        SUMAN_EXECUTABLE_PATH: sumanExecutablePath
                    })
                });
            }
            else {
                //TODO: configure 'open' command to use bash instead of Xcode

                file = require.resolve(projectRoot + '/node_modules/suman-server');

                const p = path.resolve(global.sumanHelperDirRoot + '/logs/server.log');

                fs.writeFileSync(p, '\n\n Suman server started on ' + new Date(), {
                    flags: 'w',
                    flag: 'w'
                });

                n = cp.spawn('node', [file], {
                    env: Object.assign({}, process.env, {
                        SUMAN_SERVER_OPTS: sumanCombinedOpts,
                        NODE_ENV: $NODE_ENV || process.env.NODE_ENV,
                        SUMAN_CONFIG: JSON.stringify(sumanConfig),
                        SUMAN_PROJECT_ROOT: projectRoot,
                        SUMAN_EXECUTABLE_PATH: sumanExecutablePath
                    }),
                    detached: true,
                    stdio: ['ignore', fs.openSync(p, 'a'), fs.openSync(p, 'a')]
                });

                n.on('error', function (err) {
                    console.error(err.stack || err);
                });
            }

            setImmediate(function () {
                cb(null, ret);
            });
        }

    });

}

function init($module, $opts) {

    ///////////////////////////////////
    debugger;  // leave this here forever for debugging child processes
    //////////////////////////////////

    if (this instanceof init) {
        console.log('Warning: no need to use "new" keyword with the suman init function as it is not a standard constructor');
        return init.apply(this, arguments);
    }

    // if (init.$ingletonian) {
    //     return init.$ingletonian;
    // }

    const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';
    const isViaSumanWatch = process.env.SUMAN_WATCH === 'yes';

    assert(($module.constructor && $module.constructor.name === 'Module'), 'Please pass the test file module instance as first arg to suman.init()');

    const sumanOptsFromRunner = process.env.SUMAN_OPTS ? JSON.parse(process.env.SUMAN_OPTS) : {};
    global.sumanOpts = global.sumanOpts || sumanOptsFromRunner;
    const usingRunner = global.usingRunner = (global.usingRunner || process.argv.indexOf('--$runner') > -1);

    const main = require.main.filename;
    var matches = false;

    const cwd = process.cwd();
    var projRoot = null;

    if (usingRunner) { //when using runner cwd is set to project root or test file path
        projRoot = global.projectRoot = sumanUtils.findProjectRoot(cwd);
        if (global._sFilePath === $module.filename) {
            matches = true;
        }
    }
    else {  //if we run
        if (global.sumanOpts.vverbose) {
            console.log(' => Suman vverbose message => require.main.filename value:', main);
        }
        projRoot = global.projectRoot = global.projectRoot || sumanUtils.findProjectRoot(main);
        if (main === $module.filename) {
            matches = true;
        }
    }

    const opts = $opts || {};
    const configPath = opts.configPath;

    const integrants = opts.integrants || [];
    assert(Array.isArray(integrants), '"integrants" must be an array type.');

    const oncePost = opts.post || [];
    assert(Array.isArray(oncePost), '"post" option must be an array type.');


    const waitForResponseFromRunnerRegardingPostList = oncePost.length > 0;
    const waitForIntegrantResponses = integrants.length > 0;

    //pass oncePost so that we can use it later when we need to
    global.oncePost = oncePost;

    const _interface = String(opts.interface).toUpperCase() === 'TDD' ? 'TDD' : 'BDD';
    const exportTests = (opts.export === true || singleProc);
    const writable = opts.writable || null;
    const iocData = opts.iocData || null;

    if (iocData) {
        try {
            assert(typeof iocData === 'object' && !Array.isArray(iocData)); //make sure it's an object {}
        }
        catch (err) {
            console.log(err.stack);
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
        if (process.env.SUMAN_DEBUG === 'yes' || global.sumanOpts.vverbose) {
            console.log(colors.magenta(' => Suman message => export option set to true.'));
        }
    }

    //TODO: need to validate integrants is array etc.
    // global.Promise = global.Promise || require('bluebird');
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
                    console.log('\n => ' + err.stack + '\n');
                    process.exit(constants.EXIT_CODES.COULD_NOT_FIND_CONFIG_FROM_PATH);
                    return;
                }
            }
        }

        global.sumanConfig = config;

        var maxMem = global.maxMem = {
            heapTotal: 0,
            heapUsed: 0
        };

        var interval = global.sumanConfig.checkMemoryUsage ? setInterval(function () {

            const m = process.memoryUsage();
            if (m.heapTotal > maxMem.heapTotal) {
                maxMem.heapTotal = m.heapTotal;
            }
            if (m.heapUsed > maxMem.heapUsed) {
                maxMem.heapUsed = m.heapUsed;
            }

        }, 5) : null;

        const pkgJSON = require('../package.json');
        const v = pkgJSON.version;
        console.log(colors.gray.italic(' => Suman v' + v + ' running individual test suite...'));
        console.log(' => cwd: ' + cwd);
        if (pth1 || pth2) {
            if (global.sumanOpts.verbose) {
                console.log(' => Suman verbose message => Suman config Z used: ' + (pth1 || pth2), '\n');
            }
        }
    }

    if (global.sumanOpts.verbose && !usingRunner && !global.viaSuman) {
        console.log(' => Suman verbose message => Project root:', projRoot);
    }

    global.sumanHelperDirRoot = global.sumanHelperDirRoot ||
        path.resolve(projectRoot + '/' + (global.sumanConfig.sumanHelpersDir || 'suman'));

    const errStrmPath = path.resolve(global.sumanHelperDirRoot + '/logs/test-debug.log');

    console.error('ABC =>', 'in index');

    if (usingRunner) {

        // fs.writeFileSync(errStrmPath, '\n', {flags: 'a', encoding: 'utf8'});
        // fs.appendFileSync(errStrmPath, 'start', {flags: 'a'});

        global._writeTestError = function (data) {
            process.stderr.write.apply(process.stderr, arguments);  //goes to runner
            if (process.env.SUMAN_DEBUG === 'yes') {
                fs.appendFileSync(errStrmPath, data);
            }
        };
        global._writeLog = function (data) {
            // use process.send to send data to runner? or no-op
            if (process.env.SUMAN_DEBUG === 'yes') {
                fs.appendFileSync(errStrmPath, data);
            }
        }
    }
    else {

        const strmStdoutPath = path.resolve(global.sumanHelperDirRoot + '/logs/test-output.log');
        // const strmStdout = fs.createWriteStream(strmStdoutPath, {flags: 'w'});

        global._writeLog = function (data) {
            // strmStdout.write.apply(strmStdout, arguments);
            // fs.appendFileSync(strmStdoutPath, data);
        };

        // const strm = global.testStderrStrm = fs.createWriteStream(errStrmPath, {flags: 'w'});

        global._writeTestError = function (data, ignore) {
            if (!ignore) {
                global.checkTestErrorLog = true;
            }
            // strm.write.apply(strm, arguments);
            fs.appendFileSync(errStrmPath, '\n' + data + '\n');
        };

        fs.writeFileSync(errStrmPath, '\n\n', {flags: 'a', encoding: 'utf8'});
        global._writeTestError('\n\n', true);
        global._writeTestError(' ### Suman start run indiv. @' + new Date() + ' ###', true);
        global._writeTestError(' ### Filename: ' + $module.filename, true);
        global._writeTestError(' ### Command = ' + JSON.stringify(process.argv), true);
    }

    if (!singleProc) {
        console.log(ascii.suman_slant, '\n');
    }

    ////////////////////////////////////////////////////////////////

    const blocked = process.argv.indexOf('--blocked') > -1;


    var exec = function () {
        // function may be redefined below
    };

    var unblocked = null;

    if (blocked) {
        unblocked = false;
        const onUnblockedMessage = function (data) {
            if (data.unblocked === true) {
                process.removeListener('message', onUnblockedMessage);
                unblocked = true;
                exec();
            }
        };
        process.on('message', onUnblockedMessage);
    }

    var integrantsFn = null;
    var integrantsReady = null;
    var postOnlyReady = null;

    if (waitForIntegrantResponses) {
        integrantsReady = false;
    }

    if (waitForResponseFromRunnerRegardingPostList) {
        postOnlyReady = false;
    }

    if (integrants.length < 1) {
        integrantsFn = function (cb) {
            process.nextTick(cb);
        }
    }
    else if (global.usingRunner) {

        console.error('ABC usingRunner integrantsFn=>', global.usingRunner);

        integrantsFn = function (cb) {

            console.error('ABC usingRunner integrantsFn has been called');

            const integrantsFromParentProcess = [];
            const oncePreVals = {};

            if (integrantsReady) {
                process.nextTick(cb);
            }
            else {
                var integrantMessage = function (msg) {
                    if (msg.info === 'integrant-ready') {
                        integrantsFromParentProcess.push(msg.data);
                        oncePreVals[msg.data] = msg.val;
                        if (sumanUtils.checkForEquality(integrants, integrantsFromParentProcess)) {
                            integrantsReady = true;
                            console.error('ABC integrantsReady !!! => postOnlyReady? =>', postOnlyReady);
                            if (postOnlyReady !== false) {
                                process.removeListener('message', integrantMessage);
                                console.error('About to callback with integrant ready =>');
                                cb(null, oncePreVals);
                            }
                        }
                    }
                    else if (msg.info === 'integrant-error') {
                        console.error('integrantMessage:', msg);
                        process.removeListener('message', integrantMessage);
                        cb(msg.data);
                    }
                    else if (msg.info === 'once-post-received') {
                        // note: we need to make sure the runner received the "post" requirements of this test
                        // before this process exits
                        postOnlyReady = true;
                        console.error('ABC postOnlyReady => integrantsReady? =>', integrantsReady);
                        if (integrantsReady !== false) {
                            process.removeListener('message', integrantMessage);
                            console.error('About to callback with once-post received =>');
                            cb(null, oncePreVals);
                        }
                    }
                };

                process.on('message', integrantMessage);
                process.send({type: constants.runner_message_type.INTEGRANT_INFO, msg: integrants, oncePost: oncePost});
            }
        }
    }
    else {
        integrantsFn = function (cb) {

            //TODO: if multiple test files are reference in project and it is run without the runner,
            // we need to check if integrants are already ready

            var integPath;
            try {
                integPath = require(path.resolve(global.sumanHelperDirRoot + '/suman.once.js'));
                assert(typeof integPath === 'function', 'Your suman.once.js file needs to export a function.');
            }
            catch (err) {
                console.log('=> Suman error: no suman.once.js file found at root of your project');
                return process.nextTick(function () {
                    cb(err);
                });
            }

            const depContainerObj = integPath({temp: 'lib/index.js'});
            const d = domain.create();

            d.once('error', function (err) {

                err = new Error(' => Suman fatal error => there was a problem verifying the integrants listed in test file "' + $module.filename + '"\n' + err.stack);

                if (global.usingRunner) {
                    process.send({
                        type: constants.runner_message_type.FATAL,
                        data: {
                            msg: err.stack,
                            stack: err.stack
                        }
                    });
                }

                console.error(err.stack);
                global._writeTestError(err.stack);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_FAILURE);
            });


            d.run(function () {
                acquireDeps(integrants, depContainerObj, sumanUtils.once(global, cb));
            });
        }
    }

    function start() {

        const args = Array.prototype.slice.call(arguments);

        assert(typeof args[0] === 'string', 'First argument to top-level describe must be a string description/title for the test suite');
        if (args.length < 2) {
            throw new Error('Not enough args. Signature is Test.describe(String s, [Object opts], Function f)');
        }
        else if (args.length < 3) {
            assert(typeof args[1] === 'function', 'Options object is omitted, but then second argument must be a callback function.');
        }
        else if (args.length < 4) {
            assert(typeof args[1] === 'object' && !Array.isArray(args[1]), 'Options object should be a plain {} object.');
            assert(typeof args[2] === 'function', 'Options object is omitted, and in that case the second argument must be a callback function.');
        }
        else {
            throw new Error('Too many args. Signature is Test.describe(String, [opts], Function)')
        }

        integrantsFn(function (err, vals) {

            console.error('ABC integrantsFn callback FIRED.');


            if (err) {
                global._writeTestError(err.stack || err);
                process.exit(constants.EXIT_CODES.INTEGRANT_VERIFICATION_ERROR);
            }
            else {

               const userData = global.userData = {
                    'suman.once.pre.js': vals
                };

                //TODO: need to properly toggle boolean that determines whether or not to try to create dir
                makeSuman($module, _interface, true, config, function (err, suman) {

                    if (err) {
                        global._writeTestError(err.stack || err);
                        process.exit(constants.EXIT_CODES.ERROR_CREATED_SUMAN_OBJ);
                    }
                    else {

                        var ioc;

                        try {
                            //TODO: need to update this
                            ioc = require(path.resolve(global.sumanHelperDirRoot + '/suman.ioc.js'));
                        }
                        catch (err) {
                            try {
                                //TODO: shouldn't have to call findProjectRoot() here...should be already defined
                                ioc = require(path.resolve(sumanUtils.findProjectRoot(process.cwd()) + '/suman/suman.ioc.js'));
                            } catch (err) {
                                console.log(' => Suman tip => Create your own suman.ioc.js file instead of using the default file.\n');
                                ioc = require(path.resolve(__dirname + '/../default-conf-files/suman.default.ioc.js'));
                            }
                        }

                        //TODO: perhaps pass suman.once.pre.js data to ioc also
                        const iocConfiguration = global.iocConfiguration = ioc(iocData);

                        if (exportTests && matches) {

                            const $code = constants.EXIT_CODES.EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY;

                            console.error(' => Suman error => You have declared export:true in your suman.init call, but ran the test directly.');
                            //note: need to be explicit since we haven't attached process.on('exit') handler yet...
                            console.log('\n\n => Suman exiting with code: ', $code, '\n\n');

                            if (usingRunner) {
                                suman.logFinished(null, function (err, exitCode) {
                                    process.exit($code);  //use original code
                                });
                            }
                            else {
                                global._writeTestError(' => Suman error => You have declared export:true in your suman.init call, but ran the test directly.');
                                process.exit($code);
                            }

                        }
                        else {

                            suman._sumanEvents = sumanEvents;

                            const run = require('./exec-suite').main(suman);

                            console.error('before setImmediate');

                            setImmediate(function () {

                                // IMPORTANT: setImmediate allows for future possibility of multiple test suites referenced in the same file
                                // other async "integrantsFn" probably already does this

                                if (exportTests === true) { //TODO: if we use this, need to make work with integrants/blocked etc.

                                    $module.exports.tests.push(function ($argz) {
                                        run.apply(global, args.concat($argz));
                                    });

                                    sumanEvents.emit('test', function () {
                                        const argz = Array.prototype.slice.call(arguments);
                                        args.push(argz);
                                        args.push(sumanEvents);
                                        // args.push(iocData || null);
                                        // args.push(suman.userData);
                                        run.apply(global, args);
                                    });


                                    if (writable) {
                                        args.push([]); // [] is empty array representing extra/ $uda
                                        args.push(writable); //TODO: writable should be same as sumanEvents (?)
                                        // args.push(iocData);
                                        // args.push(suman.userData);
                                        run.apply(global, args);
                                    }

                                }
                                else if (unblocked === false) {
                                    exec = function () {
                                        run.apply(global, args);
                                    };
                                }
                                else {  //if  unblocked === true or if unblocked === null etc

                                    console.error('in standard block');
                                    args.push([]);  // [] is empty array representing extra/ $uda
                                    args.push(sumanEvents);
                                    // args.push(iocData);
                                    // args.push(suman.userData);
                                    debugger;
                                    run.apply(global, args);  //args are most likely (desc,opts,cb)
                                }
                            });
                        }

                    }

                });
            }

        });
    }

    start.skip = function () {
        //TODO: do some process.exit stuff here
        process.nextTick(function () {
            process.exit(constants.EXIT_CODES.WHOLE_TEST_SUITE_SKIPPED);
        });
    };

    start.only = start; //TODO: need to pass opts in

    init.$ingletonian = {
        parent: $module.parent, //parent is who required the original $module
        file: global.sumanTestFile = $module.filename
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
    strm.cork();

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
    throw new Error('Suman auto-fail error');
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

// if(require.main === module){
//     console.log(' => Suman message => running Suman index.');
//     return require('../index');  //when user wants to execute Suman, force usage of other index file
// }