/**
 * Created by amills001c on 11/24/15.
 */

//TODO: listen to the drain event on process.stdout to get synchronous logging...

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
//const colors = require('colors');
var debug = require('debug')('suman:core');
var a8b = require('ansi-8-bit'), fg = a8b.fg, bg = a8b.bg;
var os = require('os');

//#local
var ascii = require('./ascii');
var makeNetworkLog = require('./make-network-log');
var sumanUtils = require('./suman-utils');
var findSumanServer = require('./find-suman-server');
var runnerLog = require('./sync-logger');

///////////////////////////////////////////////////////////////////////////

var stdout, stderr;

if (os.platform() === 'win32') {
    stdout = fs.openSync('NUL', 'a');
    stderr = fs.openSync('NUL', 'a');
}
else {
    stdout = fs.openSync('/dev/null', 'a');
    stderr = fs.openSync('/dev/null', 'a');
}


///////////////////////////////////////////////////////////////////////////


/*var stream = fs.createWriteStream(path.resolve(appRootPath + '/tmp/log.txt'));

 global.console = {};
 console.log = function () {
 var args = Array.prototype.slice.call(arguments);
 args.forEach(function (arg) {
 stream.write(' ' + arg);
 });
 stream.write('\na');
 };

 console.log('*** this file will contain console.log output ***');*/


function make() {

    var config, server, timestamp, networkLog, allFiles = [];

    var setup = {
        usingLiveSumanServer: false,
        messagesCount: -1
    };

    /*   process.on('beforeExit',function(){

     console.log('before-exit');
     });*/

    process.on('exit', function (msg) {

        if (process.send) {
            process.send(msg);
        }

        runnerLog('\nsuman runner exiting...with msg:' + util.inspect(msg) + '\n\n');
        //process.exit(775);
    });


    process.on('error', function (err) {

        runnerLog('error in runner:\n' + err.stack);
        //process.exit(776);
    });


    process.on('uncaughtException', function (msg) {

        runnerLog('uncaughtException...with msg:' + msg.stack);
        //process.exit(777);

    });


    process.on('message', function (data) {
        runnerLog('runner received message:' + util.inspect(data));
    });


    var successCount = 0;

    function logTestResult(data) {

        if (setup.usingLiveSumanServer) {
            networkLog.sendTestData(data);
        }
        else {
            var json = JSON.stringify(data.test);

            if (data.outputPath) {
                fs.appendFileSync(data.outputPath, json += ',');
            }
        }


        if (data.test.error) {
            runnerLog('\n\n ' + colors.bgYellow(' \u2718 test fail ') + '  "' + data.test.desc + '"  ' + colors.yellow(data.test.error + '\n'));
        }
        else {
            successCount++;

            if (config.output.standard) {
                runnerLog(colors.green(' \u2714') + ' Test passed: ' + data.test.desc + '\n');
            }
            else {

                readline.clearLine(process.stdout, 0);
                runnerLog('\r' + colors.green('Pass count: ' + successCount));

            }

        }
    }


    function logTestData(data) {

        if (setup.usingLiveSumanServer) {
            networkLog.sendTestData(data);
        }
        else {
            var json = JSON.stringify(data.test);

            if (data.outputPath) {
                fs.appendFileSync(data.outputPath, json += ',');
            }
            else {
                throw new Error('not outputPath...!');
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
                /*  function (cb) {
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
                 },*/
                function (cb) {
                    makeTemp.makeComplete({
                        usingLiveSumanServer: setup.usingLiveSumanServer,
                        timestamp: timestamp,
                        config: config,
                        allFiles: allFiles,
                        server: server
                    }, function (err) {
                        if (err)
                            runnerLog(err.stack);
                        cb(null);
                    });
                }
            ],
            function complete(err, results) {
                process.exit(exitCode);
            });

    }

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
                    logTestData(msg); //TODO: might be bug in spacing here
                    break;
                case 'LOG_RESULT':
                    logTestResult(msg); //TODO: might be bug in spacing here
                    break;
                case 'FATAL':
                    runnerLog('\n\n ' + colors.red('fatal suite error: ' + msg.msg + '\n'));
                    break;
                case 'NON_FATAL_ERR':
                    runnerLog('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
                    break;
                case 'CONSOLE_LOG':
                    console.log(msg.msg);
                    break;
                case 'MAX_MEMORY':
                    debug('\nmax memory: ' + util.inspect(msg.msg));
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

    var doneCount = 0;
    var MAX_MEMORY = 5000;
    var listening = true;
    var messages = [];
    var forkedCount = 0;


    function runSumanGroup(grepFile, sumanGroup) {


        var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);
        if (setup.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }

        var ext = null;

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
                    runnerLog('you wanted to run file with this name:' + dir + 'but it is not a .js file');
                    return;
                }

                baseName = path.basename(baseName, '.js'); //now we just look at the name of the file without extension

                if (grepFile && !(String(baseName).search(grepFile) > -1)) {
                    runnerLog('you wanted to run file with this name:' + dir + 'but it didnt match the regex you passed in:' + grepFile);
                    return;
                }

                var file = path.resolve(dir);
                files.push(file);
                allFiles.push(file);

            }

            else {

                fs.readdirSync(dir).forEach(function (file) {

                    var fileName = String(file);

                    file = path.resolve(dir + '/' + file);

                    if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                        if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                            runnerLog('\nskipping file with this name:' + fileName + '...\ndue to the regex you passed in for --grep-file: ' + grepFile + '\n');
                        }
                        else {
                            files.push(file); //we have a match
                            allFiles.push(file);
                        }
                    }
                    else {
                        runnerLog('you wanted to run file with this name:' + file + 'but it is not a .js file');
                    }

                });

                var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


                //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],


                ext = _.extend({}, {
                    silent: true,
                    //stdio: ['ignore', stdout, stderr],
                    execArgv: ['--expose-gc', '--harmony'],
                    env: {
                        'NODE_ENV': process.env.NODE_ENV,
                        'HOME': process.env.HOME,
                        'USERPROFILE': process.env.USERPROFILE
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

            var suites = tempCount === 1 ? 'suite' : 'suites';
            var processes = tempCount === 1 ? 'process' : 'processes';
            runnerLog('\n\u058D ' + tempCount + ' ' + processes + '  running ' + tempCount + ' ' + suites + '\n\n');


        });

        runnerLog('\n\n');
    }

    function runSingleOrMultipleDirs(grepFile, dirs) {

        var files = [];
        var args = process.argv.slice(2).concat('--runner').concat('--ts').concat(timestamp);
        if (setup.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }

        var ext = null;

        dirs = _.flatten([dirs]);  //handle if dirs is not an array

        dirs.forEach(function (dir) {

            if (!path.isAbsolute(dir)) {
                dir = path.resolve(appRootPath + '/' + dir); //TODO fix this path?
            }

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
                    runnerLog('you wanted to run file with this name:' + dir + 'but it is not a .js file');
                    return;
                }

                baseName = path.basename(baseName, '.js'); //now we just look at the name of the file without extension

                if (grepFile && !(String(baseName).search(grepFile) > -1)) {
                    runnerLog('you wanted to run file with this name:' + dir + 'but it didnt match the regex you passed in:' + grepFile);
                    return;
                }

                var file = path.resolve(dir);
                files.push(file);
                allFiles.push(file);

            }

            else {

                fs.readdirSync(dir).forEach(function (file) {

                    var fileName = String(file);

                    file = path.resolve(dir + '/' + file);

                    if (fs.statSync(file).isFile() && path.extname(file) === '.js') {

                        if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                            runnerLog('\nskipping file with this name: "' + colors.cyan(fileName) + '"\n--> due to the regex you passed in for --grep-file: ' + grepFile + '\n');
                        }
                        else {
                            files.push(file); //we have a match
                            allFiles.push(file);
                        }
                    }

                    else {
                        runnerLog('\nYou wanted to run the file with this path: ' + colors.cyan(String(file)) + '\n...but it is either a folder or is not a .js file\n' +
                            'if you want to run *subfolders* you shoud use the recursive option -r\n' +
                            '...be sure to only run files that constitute Suman tests, otherwise weird sh*t might happen.\n\n');
                    }

                });

                var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


                //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],

            }
        });

        ext = _.extend({}, {
            //stdio: ['ignore', stdout, stderr],
            silent: true,
            execArgv: ['--expose-gc', '--harmony'],
            env: {
                'NODE_ENV': process.env.NODE_ENV,
                'HOME': process.env.HOME,
                'USERPROFILE': process.env.USERPROFILE
            },
            detached: false   //TODO: detached:false works but not true
        });

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

        var suites = forkedCount === 1 ? 'suite' : 'suites';
        var processes = forkedCount === 1 ? 'process' : 'processes';
        runnerLog('\n\n\t => ' + forkedCount + ' ' + processes + ' running ' + forkedCount + ' ' + suites + '\n\n\n');

    }


    return function findTestsAndRunThem(dirs, $config, sumanGroup, grepFile, grepSuite) {

        runnerLog('\n\n');

        if (dirs) {
            /* if (!Array.isArray(dirs)) {
             throw new Error('You passed in a value for dirs that was not an array.');
             }*/
            if (sumanGroup) {
                throw new Error('both dirs and sumanGroup defined, you can only choose one.');
            }
        }

        config = $config;

        timestamp = String(Date.now());
        networkLog = makeNetworkLog(config, timestamp, setup);
        server = findSumanServer(config, null);


        networkLog.createNewTestRun(config, null, function (err) {

            if (err) {
                throw err;
            }

            //runnerLog(fg.getRgb(12, 23, 24) + bg.getRgb(34, 34, 34) + ascii.suman_runner + a8b.reset);
            runnerLog(ascii.suman_runner);

            if (dirs) {
                runSingleOrMultipleDirs(grepFile, dirs);
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


if (process.send) { //this file was launched as a child_process so we run the run function

    runnerLog('\nargv:' + process.argv + '\n\n');

    var pth = process.argv.indexOf('--pth') > -1 ? process.argv[process.argv.indexOf('--pth') + 1] : null;

    //we send in the configuration as a string, then parse it
    var conf = process.argv.indexOf('--cfg') > -1 ? JSON.parse(process.argv[process.argv.indexOf('--cfg') + 1]) : null;
    var sg = process.argv.indexOf('--sg') > -1 ? JSON.parse(process.argv[process.argv.indexOf('--sg') + 1]) : null;


    var grepFile;

    if (process.argv.indexOf('--grep-file') > -1) { //does our flag exist?
        grepFile = process.argv[process.argv.indexOf('--grep-file') + 1]; //grab the next item
        if (grepFile && String(grepFile).length > 0) {
            grepFile = new RegExp(grepFile);
        }
        else {
            runnerLog('bad grep-file command => ' + grepFile + ', but Suman will ignore it.');
        }
    }

    try {
        run(pth, conf, sg, grepFile);
    }
    catch (err) {
        console.error(err.stack);
    }

}

module.exports = run;


