/**
 * Created by amills001c on 11/24/15.
 */


//#core
var util = require('util');
var ee = require('./ee');
var async = require('async');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var _ = require('underscore');
var appRootPath = require('app-root-path');
var makeTemp = require('./finalize-output');
var ijson = require('idempotent-json');
var readline = require('readline');
var colors = require('colors/safe');
var debug = require('debug')('suman');

//#local
var makeNetworkLog = require('./make-network-log');


///////////////////////////////////////////////////////////////////////////

var stream = fs.createWriteStream(path.resolve(appRootPath + '/tmp/log.txt'));

global.console = {};
console.log = function () {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function (arg) {
        stream.write(' ' + arg);
    });
    stream.write('\n');
};

console.log('*** this file will contain console.log output ***');


function make() {

    var config, timestamp, networkLog;

    var setup = {
        serverIsLive: false,
        messagesCount: -1
    };

    process.on('beforeExit',function(){

        console.log('before-exit');
    });

    process.on('exit', function (msg) {

        if (process.send) {
            process.send(msg);
        }

        process.stdout.write('\nsuman runner exiting...with msg:' + util.inspect(msg));
        //process.exit(775);
    });


    process.on('error', function (err) {

        process.stdout.write('error in runner:\n' + err.stack);
        //process.exit(776);
    });


    process.on('uncaughtException', function (msg) {

        process.stdout.write('uncaughtException...with msg:' + msg.stack);
        //process.exit(777);

    });


    process.on('message', function (data) {
        process.stdout.write('runner received message:' + util.inspect(data));
    });


    var successCount = 0;

    function logTestResult(data) {

        if (setup.serverIsLive) {
            networkLog.sendTestData(data);
        }
        else {
            var json = JSON.stringify(data.test);

            if (data.outputPath) {
                fs.appendFileSync(data.outputPath, json += ',');
            }
        }


        if (data.test.error) {
            process.stdout.write('\n\n ' + colors.bgYellow(' \u2718 test fail ') + '  ' + data.test.desc + colors.yellow('  ' + data.test.error + '\n'));
        }
        else {
            successCount++;

            if (config.output.standard) {
                process.stdout.write(colors.green('\n \u2714') + ' Test passed: ' + data.test.desc);
            }
            else {

                readline.clearLine(process.stdout, 0);
                process.stdout.write('\r' + colors.green('Pass count: ' + successCount));

            }

        }
    }


    function logTestData(data) {

        if (setup.serverIsLive) {
            networkLog.sendTestData(data);
        }
        else {
            var json = JSON.stringify(data.test);

            if (data.outputPath) {
                fs.appendFileSync(data.outputPath, json += ',');
            }
        }

    }


    function makeExit(messages) {

        var exitCode = 0;

        messages.forEach(function (msg) {

            if (msg.testErrors.length > 0) {
                exitCode = 1;
            }
            if (msg.errors.length > 0) {
                exitCode = 2;
            }

        });

        async.parallel([
                function (cb) {
                    cb = _.once(cb);
                    ee.on('SOCKET_DONE', function () {
                        cb(null);
                    });
                    if (setup.messagesCount < 1) {
                        cb(null);
                    }
                    setTimeout(function () {
                        cb(new Error('timed out'));
                    }, 10000);
                },
                function (cb) {
                    makeTemp.makeComplete({
                        timestamp: timestamp,
                        config: config
                    }, function (errs) {
                        if (errs.length > 0) {
                            process.stdout.write('errs:', errs);
                        }
                        cb(null);
                    });
                }
            ],
            function complete(err, results) {
                process.exit(exitCode);
            });

    }


    function runSumanGroup(grepFile, sumanGroup) {


        var doneCount = 0;
        var MAX_MEMORY = 5000;
        var listening = true;
        var messages = [];
        var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);
        var ext = null;


        function handleMessage(msg) {

            if (listening) {

                switch (msg.type) {
                    case undefined:
                        throw new Error('wtf');
                        break;
                    case null:
                        throw new Error('huh?');
                        break;
                    case 'LOG_DATA':
                        logTestData(msg);
                        break;
                    case 'LOG_RESULT':
                        logTestResult(msg);
                        break;
                    case 'fatal':
                        process.stdout.write('\nfatal message:' + util.inspect(msg));
                        break;
                    case 'FATAL':
                        process.stdout.write('\n\n ' + colors.red('fatal suite error: ' + msg.msg + '\n'));
                        break;
                    case 'CONSOLE_LOG':
                        console.log(msg.msg);
                        break;
                    case 'MAX_MEMORY':
                        debug('\nmax memory:' + util.inspect(msg));
                        break;
                    case 'exit':
                        doneCount++;
                        messages.push(msg);
                        if (doneCount >= forkedCount) {
                            listening = false;
                            makeExit(messages);
                        }
                        break;
                    default:
                        throw new Error('soab');
                }

            }
            else {
                process.stderr.write('this shouldnt happen');
                throw new Error('this shouldnt happen');
            }
        }

        var forkedCount = 0;

        sumanGroup.groups.forEach(function (group) {

            var files = [];

            var dir = path.resolve(appRootPath + '/' + group.dir);

            var stat;
            try {
                stat = fs.statSync(dir);
            }
            catch (err) {
                console.error(err.stack);
                return;
            }

            if (stat.isFile()) {

                var baseName = path.basename(dir);

                if (path.extname(baseName) !== '.js') {
                    process.stdout.write('you wanted to run file with this name:' + dir + 'but it is not a .js file');
                    return;
                }

                baseName = path.basename(baseName,'.js'); //now we just look at the name of the file without extension

                if (grepFile && !(String(baseName).search(grepFile) > -1)) {
                    process.stdout.write('you wanted to run file with this name:' + dir + 'but it didnt match the regex you passed in:' + grepFile);
                    return;
                }

                ext = _.extend({}, {
                    env: {
                        'NODE_ENV': process.env.NODE_ENV
                    },
                    detached: false
                });

                var file = path.resolve(dir);
                files.push(file);

            }

            else {

                fs.readdirSync(dir).forEach(function (file) {

                    var fileName = String(file);

                    file = path.resolve(dir + '/' + file);

                    if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                        if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                            process.stdout.write('skipping file with this name:' + fileName + 'due to the regex you passed in for --grep-file:', grepFile);
                        }
                        else {
                            files.push(file); //we have a match
                        }
                    }
                    else {
                        process.stdout.write('you wanted to run file with this name:' + file + 'but it is not a .js file');
                    }

                });

                var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


                //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],


                ext = _.extend({}, {
                    execArgv: ['--expose-gc', '--harmony'],
                    env: {
                        'NODE_ENV': process.env.NODE_ENV
                    },
                    detached: false
                });

            }


            var tempCount = 0;

            files.forEach(function (file) {

                try {
                    var n = cp.fork(file, args, ext);
                    tempCount++;
                    forkedCount++;
                    n.on('message', function (msg) {
                        handleMessage(msg);
                    });
                }
                catch (err) {
                    console.error(err.stack);
                }

            });

            process.stdout.write('\n' + tempCount + ' processes running ' + tempCount + ' tests');


        });


    }

    function runSingleDir(grepFile, dir) {

        var doneCount = 0;
        var MAX_MEMORY = 3001;
        var listening = true;
        var messages = [];
        var files = [];
        var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);
        var ext = null;

        var stat;
        try {
            stat = fs.statSync(dir);
        }
        catch (err) {
            console.error(err.stack);
            return;
        }

        if (stat.isFile()) {

            var baseName = path.basename(dir);

            if (path.extname(baseName) !== '.js') {
                process.stdout.write('you wanted to run file with this name:' + dir + 'but it is not a .js file');
                return;
            }

            baseName = path.basename(baseName,'.js'); //now we just look at the name of the file without extension

            if (grepFile && !(String(baseName).search(grepFile) > -1)) {
                process.stdout.write('you wanted to run file with this name:' + dir + 'but it didnt match the regex you passed in:' + grepFile);
                return;
            }

            ext = _.extend({}, {
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                },
                detached: false
            });

            var file = path.resolve(dir);
            files.push(file);

        }

        else {

            fs.readdirSync(dir).forEach(function (file) {

                var fileName = String(file);

                file = path.resolve(dir + '/' + file);

                if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                    if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                        process.stdout.write('skipping file with this name:', fileName, 'due to the regex you passed in for --grep-file:', grepFile);
                    }
                    else {
                        files.push(file); //we have a match
                    }
                }

                else {
                    process.stdout.write('you wanted to run file with this name:', file, 'but it is either a folder or is not a .js file');
                }

            });

            var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


            //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],

            ext = _.extend({}, {
                execArgv: ['--expose-gc', '--harmony'],
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                },
                detached: false
            });

        }

        var forkedCount = 0;

        files.forEach(function (file) {

            try {
                var n = cp.fork(file, args, ext);
                forkedCount++;
                n.on('message', function (msg) {
                    handleMessage(msg);
                });
            }
            catch (err) {
                console.error(err.stack);
            }

        });

        process.stdout.write(forkedCount + ' processes running ' + forkedCount + ' tests');

        function handleMessage(msg) {

            if (listening) {

                switch (msg.type) {
                    case undefined:
                        throw new Error('wtf');
                        break;
                    case null:
                        throw new Error('huh?');
                        break;
                    case 'LOG_DATA':
                        logTestData(msg);
                        break;
                    case 'LOG_RESULT':
                        logTestResult(msg);
                        break;
                    case 'fatal':
                        process.stdout.write('\nfatal message: ' + util.inspect(msg));
                        break;
                    case 'FATAL':
                        process.stdout.write('\n\n ' + colors.red('fatal suite error: ' + msg.msg + '\n'));
                        break;
                    case 'MAX_MEMORY':
                        debug('\nmax memory :' + util.inspect(msg));
                        break;
                    case 'CONSOLE_LOG':
                        console.log(msg.msg);
                        break;
                    case 'exit':
                        doneCount++;
                        messages.push(msg);
                        if (doneCount >= files.length) {
                            listening = false;
                            makeExit(messages);
                        }
                        break;
                    default:
                        throw new Error('soab');
                }

            }
            else {
                process.stdout.write('this shouldnt happen');
                throw new Error('this shouldnt happen');
            }
        }

    }


    return function findTestsAndRunThem(dir, configPath, sumanGroup) {

        try {
            dir = dir ? path.resolve(dir) : null;
            config = configPath ? require(path.resolve(appRootPath + '/' + configPath)) : {};
            sumanGroup = sumanGroup ? JSON.parse(sumanGroup) : null;
        }
        catch (err) {
            throw err;
        }

        if (dir && sumanGroup) {
            throw new Error('both dir and sumanGroup defined.');
        }

        timestamp = String(Date.now());
        networkLog = makeNetworkLog(config, timestamp, setup);


        var grepFile;
        //var grepSuite;

        if (process.argv.indexOf('--grep-file') > -1) { //does our flag exist?
            grepFile = process.argv[process.argv.indexOf('--grep-file') + 1]; //grab the next item
            if (grepFile && String(grepFile).length > 0) {
                grepFile = new RegExp(grepFile);
            }
            else {
                process.stdout.write('bad grep-file command');
            }
        }

        networkLog.createNewTestRun(null, function (err) {

            if (dir) {
                runSingleDir(grepFile, dir);
            }
            else if (sumanGroup) {
                runSumanGroup(grepFile, sumanGroup);
            }
            else {
                throw new Error('no dir or sumanGroup defined.');
            }

        });

    }

}

var run = make();


if (process.send) {

    process.stdout.write('\nargv:' + process.argv + '\n\n');

    var pth = process.argv.indexOf('--pth') > -1 ? process.argv[process.argv.indexOf('--pth') + 1] : null;
    var sg = process.argv.indexOf('--sg') > -1 ? process.argv[process.argv.indexOf('--sg') + 1] : null;
    var conf = process.argv.indexOf('--cfg') > -1 ? process.argv[process.argv.indexOf('--cfg') + 1] : null;

    try {
        run(pth, conf, sg);
    }
    catch (err) {
        console.error(err.stack);
    }

}

module.exports = run;


