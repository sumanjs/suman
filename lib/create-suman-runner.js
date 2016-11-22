//core
const path = require('path');
const util = require('util');
const os = require('os');
const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const EE = require('events');

//npm
const sumanUtils = require('suman-utils/utils');

//project
const cwd = process.cwd();
const projectRoot = global.projectRoot || sumanUtils.findProjectRoot(cwd);


module.exports = function Runner(obj) {

    const $NODE_ENV = obj.$node_env;
    const grepFile = obj.grepFile;
    const fileOrDir = obj.fileOrDir;
    const sumanGroup = obj.sumanGroup;
    const runOutputInNewTerminalWindow = obj.runOutputInNewTerminalWindow;

    if (!fileOrDir && !sumanGroup) {
        throw new Error('need to choose either fileOrDir and sumanGroup as arguments.');
    }

    if (fileOrDir && sumanGroup) {
        throw new Error('both fileOrDir and sumanGroup arguments passed, please choose one option only.');
    }


    const ee = new EE();

    global.sumanOpts.__maxParallelProcesses = global.sumanOpts.processes || global.sumanConfig.maxParallelProcesses;

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

    const oncePath = path.resolve(global.sumanHelperDirRoot + '/suman.once.pre.js');

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
        require('./input-validation/validate-suman.order.js')(order);  //will throw error if invalid, halting the program
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
            require('./runner')(fileOrDir, sumanGroup, runOnce, order);
            setImmediate(function () {
                ee.emit('exit');
            });
        }

    });

    return ee;

};