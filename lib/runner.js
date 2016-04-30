/**
 * Created by denman on 11/24/15.
 */


/////////////////////////////////////////////////////

// probably will never have to mess with these options:
// execArgv: ['--expose-gc', '--harmony',
// '--max-executable-size='.concat(MEMORY_PER_PROCESS),
// '--max_old_space_size='.concat(MEMORY_PER_PROCESS),
// '--max_semi_space_size='.concat(MEMORY_PER_PROCESS)],

/////////////////////////////////////////////////////

const slicedArgs = process.argv.slice(2);
const execArgs = process.execArgv.slice(0);

//////////////////////////////////////////////////////////

const weAreDebugging = require('./debugging-helper/we-are-debugging');

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
const AsciiTable = require('ascii-table');
const chalk = require('chalk');
const Immutable = require('immutable');
const async = require('async');
const _ = require('lodash');
const ijson = require('siamese');
const readline = require('readline');
const colors = require('colors/safe');
const debug = require('debug')('suman:core');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;

//#project
const dual = require('./dual/shared');
const constants = require('../config/suman-constants');
const finalizeOutput = require('./finalize-output')();
const ascii = require('./ascii');
const sumanUtils = require('./utils');
const runnerLogger = require('./sync-logger');
const makeHandleBlocking = require('./runner-helpers/make-handle-blocking');

//////////////////////////////////////////////
const testResultsEmitter = new EE();


//TODO: https://github.com/mochajs/mocha/wiki/Third-party-reporters

const messages = [];
const tableRows = [];
const integrantHash = {};
const config = global.sumanConfig;
const timestamp = global.timestamp;
var doneCount = 0;
var listening = true;
var forkedCount = 0;
var processId = 1;
var server, startTime, endTime, networkLog, allFiles = [], forkedCPs = [], queuedCPs = [],
    handleBlocking, depContainerObj = null;


process.on('beforeExit', function () {

});


process.on('exit', function (code, signal) {

    if (typeof process.send === 'function') {
        throw new Error('Runner process should have no parent process.')
    }
    if (signal) {
        runnerLogger.log('\n <::::::::::::::::::::: ' + signal + ' ::::::::::::::::::::::::>');
    }
    global.sumanStderrStream.write('\n<<<<< Suman runner end <<<<<<\n\n\n\n\n\n\n\n\n');
    runnerLogger.log('\n\n\n   <::::::::::::::::::::::::::::::::: suman runner exiting with exit code: ' + util.inspect(code) +
        ' ::::::::::::::::::::::::::::::::::>\n\n');
});


process.on('error', function (err) {
    runnerLogger.log('error in runner:\n' + err.stack);
    //process.exit(776);
});


process.on('uncaughtException', function (msg) {

    console.log(msg);
    runnerLogger.log('uncaughtException...with msg:' + msg.stack);
    //process.exit(777);

});


process.on('message', function (data) {
    runnerLogger.log('runner received message:' + util.inspect(data));
});


function logTestResult(data) {

    // if (setup.usingLiveSumanServer) {
    //     networkLog.sendTestData(data);
    // }
    // else {
    //     var json = JSON.stringify(data.test);
    //
    //     if (data.outputPath) {
    //         fs.appendFileSync(data.outputPath, json += ',');
    //     }
    // }

    const test = data.test;

    dual.broadcastOrWrite('test-case-end', test);

    if (test.errorDisplay) {
        dual.broadcastOrWrite('test-case-fail', test, '\n\n\t' +
            colors.magenta.bold.bgYellow(' \u2718  => test fail ') + '  "' +
            test.desc + '"\n' + chalk.yellow(test.errorDisplay) + '\n\n');
    }
    else {

        if (test.skipped) {
            dual.broadcastOrWrite('test-case-skipped', test, '\t' +
                chalk.yellow(' \u21AA ') + ' (skipped) \'' + test.desc + '\'\n');
        }
        else if (test.stubbed) {
            dual.broadcastOrWrite('test-case-stubbed', test, '\t' +
                chalk.yellow(' \u2026 ') + ' (stubbed) \'' + test.desc + '\'\n');
        }
        else {

            dual.broadcastOrWrite('test-case-pass', test, '\t' +
                chalk.green(' \u2714 ') + ' \'' + test.desc + '\'\n');

            //TODO: allow printing of just one line of results, until a failure
            //readline.clearLine(process.stdout, 0);
            //process.stdout.write('\r' + chalk.green('Pass count: ' + successCount));

        }
    }
}

function handleTableData(data) {
    tableRows.push(data);
}

function logTestData(data) {

    // if (setup.usingLiveSumanServer) {
    //     networkLog.sendTestData(data);
    // }
    // else {

    throw new Error('this should be used currently');

    //TODO: fix this
    var json = JSON.stringify(data.test);

    if (data.outputPath) {
        // console.log('data from test:',json);
        fs.appendFileSync(data.outputPath, json += ',');  //sync call so that writes don't get corrupted

    }
    else {
        throw new Error('not outputPath...!');
    }
    // }

}


function makeExit(messages, timeDiff) {

    var exitCode = 0;

    messages.every(function (msg) {  //use [].every hack to return more quickly

        const code = msg.code;
        const signal = msg.signal;

        if (code > 0) {
            exitCode = 1;
            return false;
        }
        return true;

    });

    const table1 = new AsciiTable('Suman Runner Result');
    const table2 = new AsciiTable('Overall Consolidated');

    if (typeof tableRows[0] === 'object') {

        table1.setHeading.apply(table1, Object.keys(tableRows[0]));
        tableRows.forEach(function (row) {
            table1.addRow.apply(table1, Object.keys(row).map(key => row[key]));
        });

        console.log('\n\n');
        var str1 = table1.toString();
        str1 = '\t' + str1;
        console.log(str1.replace(/\n/g, '\n\t'));
        console.log('\n');
    }
    else {
        console.error('\n\n\t => Suman warning => All tests invoked by runner errored-out before sending meaningful results info. Therefore, there\n' +
            '\t\tis no table data to display.\n\n');
    }


    table2.setHeading('Name', 'Title', 'Total Time');
    table2.addRow('', '', timeDiff);


    console.log('\n\n');
    var str2 = table2.toString();
    str2 = '\t' + str2;
    console.log(str2.replace(/\n/g, '\n\t'));
    console.log('\n');


    async.parallel([
            function (cb) {
                finalizeOutput.makeComplete({
                    usingLiveSumanServer: global.usingLiveSumanServer || false, //TODO
                    timestamp: timestamp,
                    config: config,
                    allFiles: allFiles,
                    server: server
                }, function (err) {
                    if (err) {
                        runnerLogger.log(err.stack);
                    }
                    cb(null);
                });
            }
        ],
        function complete(err, results) {
            process.exit(exitCode);
        });

}


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
        console.error(err.stack);
        const cps = integrantHash[intg];
        integrantHash[intg] = err;
        cps.forEach(function (cp) {
            cp.send({info: 'integrant-error', data: err});
        });
        throw new Error('Integrant information requested is not present in suman.once.js => ' + intg + '\n' + err.stack);
    });

    function sendOutMsg() {

        const cps = integrantHash[intg];
        integrantHash[intg] = 'READY';
        cps.forEach(function (cp) {
            cp.send({info: 'integrant-ready', data: intg});
        });

    }

    d.run(function () {
        process.nextTick(function () {
            const fn = depContainerObj[intg];
            assert(typeof fn === 'function', 'Integrant listing is not a function => ' + intg);
            if (fn.length > 0) {
                fn.apply(global, [function (err) {
                    if (err) {
                        //TODO: fix this, need to handle error properly
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
                }, function (err) {
                    throw err;
                });
            }
        });
    });
}


function handleMessage(msg, n) {


    if (listening) {

        switch (msg.type) {

            case constants.runner_message_type.TABLE_DATA:
                handleTableData(msg.data);
                break;
            case constants.runner_message_type.INTEGRANT_INFO:
                handleIntegrantInfo(msg, n);
                break;
            case constants.runner_message_type.LOG_DATA:
                logTestData(msg);
                break;
            case constants.runner_message_type.LOG_RESULT:
                logTestResult(msg);
                break;
            case constants.runner_message_type.FATAL_SOFT:
                runnerLogger.log('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
                break;
            case constants.runner_message_type.FATAL:

                //TODO: need to make sure this is only called once per file
                //TODO: https://www.dropbox.com/s/qbak4a9bgml31jx/Screenshot%202016-04-09%2017.20.57.png?dl=0

                msg = msg.data;

                const message = [
                    colors.bgRed.black(' => Suman runner => there was a fatal test suite error - an error was encountered in your test code that prevents Suman'),
                    colors.bgRed.black(' from continuing with a particular test suite with the following path:'),
                    colors.bgBlack.white(' => ' + n.testPath),
                    colors.red(String(msg.error ? msg.error : JSON.stringify(msg)).replace(/\n/g, '\n\t')),
                    '\n\n'
                ];

                runnerLogger.logArray(message);
                break;
            case constants.runner_message_type.WARNING:
                runnerLogger.log('\n\n ' + colors.bgYellow('Suman warning: ' + msg.msg + '\n'));
                break;
            case constants.runner_message_type.NON_FATAL_ERR:
                runnerLogger.log('\n\n ' + colors.red('non-fatal suite error: ' + msg.msg + '\n'));
                break;
            case constants.runner_message_type.CONSOLE_LOG:
                console.log(msg.msg);
                break;
            case constants.runner_message_type.MAX_MEMORY:
                console.log('\nmax memory: ' + util.inspect(msg.msg));
                break;
            default:
                throw new Error('Bad msg.type in runner');
        }

    }
    else {
        process.stderr.write('this shouldn\'t happen!!!');
        //throw new Error('this definitely shouldn\'t happen');
    }
}


function runSumanGroup(grepFile, sumanGroup) {

    // TODO

}


function runSingleOrMultipleDirs(grepFile, dirs) {

    var files = [];
    const args = [].concat('--suman').concat('--runner').concat('--ts').concat(timestamp);

    if (global.usingLiveSumanServer) {
        args.push('--live_suman_server');
    }

    args.push('--sumanOpts');
    args.push(JSON.stringify(global.sumanOpts));

    var ext = null;

    dirs = _.flatten([dirs]);  //handle if dirs is not an array
    const cwd = process.cwd();

    dirs.forEach(function (dir) {

        (function getAllFiles(dir, isFile) {

            if (!path.isAbsolute(dir)) {
                dir = path.resolve(sumanUtils.findProjectRoot(cwd) + '/' + dir); //TODO fix this path?
            }
            //else {
            // TODO: handle "absolute" dirs correctly
            //    console.log('You have passed an absolute file or directory:', dir);
            //}

            var stat;
            try {
                stat = fs.statSync(dir);
            }
            catch (err) {
                console.error(err.stack);
                return;
            }

            if (isFile !== false && stat.isFile()) {

                var baseName = path.basename(dir);

                if (path.extname(baseName) !== '.js') {
                    runnerLogger.log('you wanted to run file with this name:' + dir + 'but it is not a .js file');
                    return;
                }

                baseName = path.basename(baseName, '.js'); //now we just look at the name of the file without extension

                if (grepFile && !(String(baseName).search(grepFile) > -1)) {
                    runnerLogger.log('you wanted to run file with this name:' + dir + 'but it didnt match the regex you passed in:' + grepFile);
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

                    var stat = fs.statSync(file);

                    if (stat.isFile() && path.extname(file) === '.js') {

                        if (grepFile && !(String(fileName).search(grepFile) > -1)) {  //if grepFile regex is defined, we need to make sure filename matches the search
                            runnerLogger.log('\n => Suman message => skipping file with this name: "' + colors.cyan(fileName) + '"\n   due to the regex you passed in for --grep-file: ' + grepFile + '\n');
                        }
                        else {
                            files.push(file); //we have a match
                            allFiles.push(file);
                        }
                    }
                    else if (stat.isDirectory() && global.sumanOpts.recursive) {

                        getAllFiles(file, false);
                    }
                    else {

                        if (global.sumanOpts.debug || global.sumanOpts.verbose) {
                            const msg = [
                                '\n\t => Suman message => You wanted to run the file with this path:',
                                colors.cyan(String(file)),
                                '...but it is either a folder or is not a .js file',
                                'if you want to run *subfolders* you shoud use the recursive option -r',
                                '...be sure to only run files that constitute Suman tests, to enforce this we',
                                'recommend a naming convention to use with Suman tests, see: oresoftware.github.io/suman\n\n'
                            ];

                            runnerLogger.logArray(msg);
                        }

                    }

                });
            }

        })(dir)
    });


    handleBlocking.determineInitialStarters(files);
    startTime = Date.now();

    files = sumanUtils.removeSharedRootPath(files);

    files.forEach(function (fileShortAndFule) {

        const file = fileShortAndFule[0];
        const shortFile = fileShortAndFule[1];

        var argz = JSON.parse(JSON.stringify(args));

        function run() {

            argz.push('--fp');
            argz.push(file);

            const execArgz = ['--expose-gc', '--harmony'];

            if (weAreDebugging) {
                if (process.argv.indexOf('--ignore-brk') < 0) {  //NOTE: this allows us to focus on debugging runner
                    execArgz.push('--debug-brk');
                }
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
            n.shortTestPath = shortFile;

            forkedCPs.push(n);

            n.on('message', function (msg) {
                handleMessage(msg, n);
            });

            n.on('error', function (err) {
                throw new Error(err);
            });

            n.on('exit', function (code, signal) {
                n.removeAllListeners();
                doneCount++;
                messages.push({code: code, signal: signal});
                if ((code > 0 && global.sumanOpts.bail) || doneCount >= forkedCPs.length) {
                    endTime = Date.now();
                    listening = false;
                    makeExit(messages, endTime - startTime);
                }
                else {
                    const testPath = n.testPath;
                    handleBlocking.releaseNextTests(testPath, queuedCPs);
                }
            });

            n.stdio[2].setEncoding('utf-8');
            // n.stdio[2].pipe(global.sumanStderrStream);

            n.stdio[2].on('data', function (data) {

                const d = String(data).split('\n').map(function (line) {
                    return '[' + n.shortTestPath + '] ' + line;
                }).join('\n');

                global.sumanStderrStream.write('\n\n');
                global.sumanStderrStream.write(d);

                if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                    //TODO: go through code and make sure that no console.log statements should in fact be console.error
                    console.error('Child stderr:', d);
                }
            });


        }

        run.testPath = file;
        run.shortTestPath = shortFile;

        if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
            queuedCPs.push(run);
            // argz.push('--blocked');
            if (process.env.NODE_ENV === 'dev_local_debug') {
                console.error('File is blocked =>', file);
            }
        }
        else {
            run();
            if (process.env.NODE_ENV === 'dev_local_debug') {
                console.log('File is running =>', file);
            }
        }

    });

    const totalCount = forkedCPs.length + queuedCPs.length;
    var suites = totalCount === 1 ? 'suite' : 'suites';
    var processes = totalCount === 1 ? 'process' : 'processes';
    //TODO: add info to demonstrate initial set running, vs total set that will be run
    //TODO: only show extra info if necessary
    runnerLogger.log('\n\n\t => initial set => ' + forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + '\n');
    const addendum = config.maxParallelProcesses < totalCount ? ' with no more than ' + config.maxParallelProcesses + ' running at a time.' : '';
    runnerLogger.log('\t => overall => ' + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + suites + addendum + '\n\n\n');

}


function findTestsAndRunThem(dirs, sumanGroup, grepFile, grepSuite, runOnce, $order) {

    const cwd = process.cwd();
    const root = sumanUtils.findProjectRoot(cwd);

    handleBlocking = makeHandleBlocking(_.mapValues($order, function (val) {
        val.testPath = path.resolve(root + '/' + val.testPath);
        return val;
    }));

    var d = domain.create();

    d.once('error', function (err) {
        console.error(err.stack);
        throw err;
    });

    d.run(function () {

        process.nextTick(function () {

            depContainerObj = runOnce();  //TODO: should this be done  before this point in the program?

            runnerLogger.log('\n\n');

            if (dirs) {
                /* if (!Array.isArray(dirs)) {
                 throw new Error('You passed in a value for dirs that was not an array.');
                 }*/
                if (sumanGroup) {
                    throw new Error('both dirs and sumanGroup defined, you can only choose one.');
                }
            }

            runnerLogger.log(ascii.suman_runner);

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


module.exports = findTestsAndRunThem;


