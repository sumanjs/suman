/**
 * Created by denman on 11/24/15.
 */


/////////////////////////////////////////////////////

const slicedArgs = process.argv.slice(2);
const execArgs = process.execArgv.slice(0);

//////////////////////////////////////////////////////////

const isDebug = execArgs.indexOf('--debug') > 0;
if (isDebug) {
    console.log('=> we are debugging with the --debug flag');
}

const inDebugMode = typeof global.v8debug === 'object';
if (inDebugMode) {
    console.log('=> we are debugging with the debug execArg');
}

const weAreDebugging = global.weAreDebugging = isDebug || inDebugMode;

///////////////////////////////////////////////////


//#core
const assert = require('assert');
const util = require('util');
const EE = require('events');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');
const domain = require('domain');

//#npm
const Immutable = require('immutable');
const async = require('async');
const _ = require('lodash');
const appRootPath = require('app-root-path');
const ijson = require('idempotent-json');
const readline = require('readline');
const colors = require('colors/safe');
const debug = require('debug')('suman:core');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;

//#project
const finalizeOutput = require('./finalize-output')();
const ascii = require('./ascii');
const makeNetworkLog = require('./make-network-log');
const sumanUtils = require('./utils');
const findSumanServer = require('./find-suman-server');
const runnerLog = require('./sync-logger');
const makeHandleBlocking = require('./runner-helpers/make-handle-blocking');

//////////////////////////////////////////////
const testResultsEmitter = new EE();


//TODO: https://github.com/mochajs/mocha/wiki/Third-party-reporters


var processId = 1;

function make() {

    var config, server, timestamp, networkLog,
        allFiles = [], forkedCPs = [], handleBlocking, depContainerObj = null;


    var setup = {
        usingLiveSumanServer: false,
        messagesCount: -1
    };

    process.on('beforeExit', function () {

    });


    process.on('exit', function (msg) {

        if (process.send) {
            process.send(msg);
        }

        runnerLog('\n\t<:::::::::::::> suman runner exiting with exit code: ' + util.inspect(msg) + ' <:::::::::::::>\n');
    });


    process.on('error', function (err) {

        runnerLog('error in runner:\n' + err.stack);
        //process.exit(776);
    });


    process.on('uncaughtException', function (msg) {

        console.log(msg);
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
            runnerLog('\n\n\t' + colors.black.bold.bgYellow(' \u2718 test fail ') + '  "' + data.test.desc + '"  ' + colors.yellow(data.test.error) + '\n');
        }
        else {
            successCount++;

            if (config.output.standard) {
                runnerLog(colors.green('\t\u2714') + '   Test passed:   ' + data.test.desc + '\n');
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
                fs.appendFileSync(data.outputPath, json += ',');  //sync call so that writes don't get corrupted
            }
            else {
                throw new Error('not outputPath...!');
            }
        }

    }


    function makeExit(messages) {

        var exitCode = 0;

        messages.forEach(function (msg) {

            console.log('msg:',msg);

            //if (msg.testErrors.length > 0) {
            //    exitCode = 1;
            //}
            //if (msg.errors.length > 0) {
            //    exitCode = 2;
            //}

        });

        async.parallel([
                function (cb) {
                    finalizeOutput.makeComplete({
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

    const integrantHash = {};


    function handleIntegrantInfo(msg, n) {

        var integrants = msg.msg;

        integrants.forEach(function (intg) {

            if (!(String(intg) in integrantHash)) {
                integrantHash[String(intg)] = [];
                integrantHash[String(intg)].push(n);   //store cps in hash, with integrant names as keys
                setTimeout(function () {
                    verifyIntegrant(intg);
                }, 10);
            }
            else if (String(integrantHash[intg]).toUpperCase() === 'READY') {
                n.send({info: 'integrant-ready', data: intg});
            }
            else if (integrantHash[intg] instanceof Error) {
                n.send({info: 'integrant-error', data: integrantHash[intg].stack});
            }
            else if (Array.isArray(integrantHash[intg])) {
                integrantHash[intg].push(n);
            }
            else {
                throw new Error('Unknown state of integrant readiness.')
            }


        });

    }


    function verifyIntegrant(intg) {

        const d = domain.create();

        d.once('error', function (err) {
            const cps = integrantHash[intg];
            integrantHash[intg] = err;
            cps.forEach(function (cp) {
                cp.send({info: 'integrant-error', data: err});
            });
        });

        function sendOutMsg() {

            const cps = integrantHash[intg];
            integrantHash[intg] = 'READY';
            cps.forEach(function (cp) {
                cp.send({info: 'integrant-ready', data: intg});
            });

        }

        d.run(function () {
            const fn = depContainerObj[intg];
            assert(typeof fn === 'function', 'Integrant listing is not a function => ' + intg);
            if (fn.length > 0) {
                fn.apply(global, [function (err) {
                    if (err) {
                        throw err;
                    }
                    else {
                        sendOutMsg();
                    }
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(function () {
                    sendOutMsg();
                }).catch(function (err) {
                    throw err;
                });
            }

        });

    }


    function handleMessage(msg, n) {


        if (listening) {

            switch (msg.type) {
                case 'INTEGRANT_INFO':
                    handleIntegrantInfo(msg, n);
                    break;
                case 'LOG_DATA':
                    logTestData(msg);
                    break;
                case 'LOG_RESULT':
                    logTestResult(msg);
                    break;
                case 'FATAL_SOFT':
                    runnerLog('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
                    break;
                case 'FATAL':
                    runnerLog('\n\n ' + colors.bgBlack.magenta(' => Suman runner was a relayed a message from a child_process - there was a fatal test suite error - an error was encountered in your test code that prevents Suman') + '\n' +
                        '    ' + colors.bgBlack.magenta('from continuing with a particular test suite with the following path:') + '\n    ' +
                        colors.red(JSON.stringify(msg.msg || msg)) + ' => error => ' + (JSON.stringify(msg.error || msg || '')) + '\n\n\n');
                    break;
                case 'WARNING':
                    runnerLog('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
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
                //case 'exit':
                //    const testPath = n.testPath;
                //    handleBlocking.releaseNextTests(testPath, forkedCPs);
                //    doneCount++;
                //    messages.push(msg);
                //    if (doneCount >= forkedCount) {
                //        listening = false;
                //        makeExit(messages);
                //    }
                //    break;
                default:
                    throw new Error('Bad msg.type in runner');
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


  /*  function runSumanGroup(grepFile, sumanGroup) {

        const args = [].concat('--suman').concat('--runner').concat('--ts').concat(timestamp);
        if (setup.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }

        const cwd = process.cwd();

        var ext = null;

        sumanGroup.groups.forEach(function (group) {

            var files = [];

            //var dir = path.resolve(appRootPath + '/' + group.dir);

            var dir;

            if (!path.isAbsolute(group.dir)) {
                dir = path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + group.dir); //TODO fix this path?
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
                            runnerLog('\n => Suman message => skipping file with this name:' + fileName + '...\n => due to the regex you passed in for --grep-file: ' + grepFile + '\n');
                        }
                        else {
                            files.push(file); //we have a match
                            allFiles.push(file);
                        }
                    }
                    else {
                        runnerLog(' => Suman message => you wanted to run file with this name:' + file + 'but it is not a .js file');
                    }

                });

                var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


                //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],


            }

            var tempCount = 0;

            files.forEach(function (file) {


                var execArgz = ['--expose-gc', '--harmony'];

                if (weAreDebugging) {
                    execArgz.push('--debug=' + (5303 + processId++));
                }

                ext = _.merge({}, {
                    silent: true,
                    stdio: [],
                    //stdio: ['ignore', stdout, stderr],
                    execArgv: execArgz,
                    env: {
                        'NODE_ENV': process.env.NODE_ENV,
                        'HOME': process.env.HOME,
                        'USERPROFILE': process.env.USERPROFILE
                    },
                    detached: false
                });


                const n = cp.fork(file, args, ext);
                tempCount++;
                forkedCount++;
                n.on('message', function (msg) {
                    handleMessage(msg, n);
                });
                n.on('error', function (err) {
                    throw new Error(err);
                });
                n.on('exit',function(code){
                    const testPath = n.testPath;
                    handleBlocking.releaseNextTests(testPath, forkedCPs);
                    doneCount++;
                    messages.push(msg);
                    if (doneCount >= forkedCount) {
                        listening = false;
                        makeExit(messages);
                    }
                });

                if (process.env.NODE_ENV === 'dev_local') {
                    n.stdio[2].on('data', function (data) {
                        console.error('Child stderr:', data);
                    });
                }


            });

            var suites = tempCount === 1 ? 'suite' : 'suites';
            var processes = tempCount === 1 ? 'process' : 'processes';
            runnerLog('\n\u058D ' + tempCount + ' ' + processes + '  running ' + tempCount + ' ' + suites + '\n\n');

        });

        runnerLog('\n\n');
    }*/



    function runSingleOrMultipleDirs(grepFile, dirs) {

        var files = [];
        const args = [].concat('--suman').concat('--runner').concat('--ts').concat(timestamp);
        if (setup.usingLiveSumanServer) {
            args.push('--live_suman_server');
        }

        var ext = null;

        dirs = _.flattenDeep([dirs]);  //handle if dirs is not an array

        var cwd = process.cwd();

        dirs.forEach(function (dir) {

            if (!path.isAbsolute(dir)) {
                dir = path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + dir); //TODO fix this path?
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
                            runnerLog('\n => Suman message => skipping file with this name: "' + colors.cyan(fileName) + '"\n   due to the regex you passed in for --grep-file: ' + grepFile + '\n');
                        }
                        else {
                            files.push(file); //we have a match
                            allFiles.push(file);
                        }
                    }
                    else {
                        runnerLog('\n => Suman message => You wanted to run the file with this path: ' + colors.cyan(String(file)) + '\n...but it is either a folder or is not a .js file\n' +
                            'if you want to run *subfolders* you shoud use the recursive option -r\n' +
                            '...be sure to only run files that constitute Suman tests, otherwise weird sh*t might happen.\n\n');
                    }

                });

                var MEMORY_PER_PROCESS = String(Math.ceil(MAX_MEMORY / (files.length + 1)));


                //execArgv: ['--expose-gc', '--harmony', '--max-executable-size='.concat(MEMORY_PER_PROCESS), '--max_old_space_size='.concat(MEMORY_PER_PROCESS), '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],

            }
        });


        handleBlocking.determineInitialStarters(files);


        files.forEach(function (file) {

            var argz = JSON.parse(JSON.stringify(args));

            if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
                if (process.env.NODE_ENV === 'dev_local') {
                    console.error('File is blocked =>', file);
                }

                argz.push('--blocked');
            }
            else {
                if (process.env.NODE_ENV === 'dev_local') {
                    console.log('File is running =>', file);
                }

            }

            argz.push('--fp');
            argz.push(file);

            var execArgz = ['--expose-gc', '--harmony'];

            if (weAreDebugging) {
                //execArgz.push('debug');
                execArgz.push('--debug=' + (5303 + processId++));
            }

            ext = _.merge({}, {
                silent: true,
                execArgv: execArgz,
                env: {
                    'NODE_ENV': process.env.NODE_ENV,
                    'HOME': process.env.HOME,
                    'USERPROFILE': process.env.USERPROFILE
                },
                detached: false   //TODO: detached:false works but not true
            });


            const n = cp.fork(path.resolve(__dirname + '/run-child.js'), argz, ext);
            n.testPath = file;
            forkedCPs.push(n);

            forkedCount++;

            n.on('message', function (msg) {
                handleMessage(msg, n);
            });

            n.on('error', function (err) {
                throw new Error(err);
            });

            n.on('exit',function(){
                const testPath = n.testPath;
                handleBlocking.releaseNextTests(testPath, forkedCPs);
                doneCount++;
                messages.push(arguments);
                if (doneCount >= forkedCount) {
                    listening = false;
                    makeExit(messages);
                }
            });

            n.stdio[2].setEncoding('utf-8');

            if (weAreDebugging) {
                n.stdio[2].on('data', function (data) {
                    console.error('Child stderr:', data);
                });
            }

        });

        var suites = forkedCount === 1 ? 'suite' : 'suites';
        var processes = forkedCount === 1 ? 'process' : 'processes';
        runnerLog('\n\n\t => ' + forkedCount + ' ' + processes + ' running ' + forkedCount + ' ' + suites + '\n\n\n');

    }


    return function findTestsAndRunThem(dirs, $config, sumanGroup, grepFile, grepSuite, runOnce, $order) {

        const cwd = process.cwd();
        const root = sumanUtils.findProjectRoot(cwd);

        handleBlocking = makeHandleBlocking($config, _.mapValues($order, function (val) {
            val.testPath = path.resolve(root + '/' + val.testPath);
            return val;
        }));

        var d = domain.create();

        d.once('error', function (err) {
            console.error(err.stack);
            throw err;
        });

        d.run(function () {

            depContainerObj = runOnce();  //TODO: should this be done  before this point in the program?

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

            networkLog.createNewTestRun(config, server, function (err) {

                if (err) {
                    console.error(err.stack);
                }

                //runnerLog(fg.getRgb(12, 23, 24) + bg.getRgb(34, 34, 34) + ascii.suman_runner + a8b.reset);
                runnerLog(ascii.suman_runner);

                if (dirs) {
                    runSingleOrMultipleDirs(grepFile, dirs);
                }
                else if (sumanGroup) {
                    //runSumanGroup(grepFile, sumanGroup);
                    throw new Error('Not implemented yet.')
                }
                else {
                    throw new Error('no dir or sumanGroup defined.');
                }

            });

        });
    }
}

var run = make();


if (typeof process.send === 'function') { //this file was launched as a child_process so we run the run function

    // TODO: need to make this part work for possible use

    runnerLog('\nargv:' + process.argv + '\n\n');

    var pth = process.argv.indexOf('--pth') > -1 ? process.argv[process.argv.indexOf('--pth') + 1] : null;

    //we sent the configuration as a string, now parse it here
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


