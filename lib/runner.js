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
const cwd = process.cwd();
const root = sumanUtils.findProjectRoot(cwd);

//TODO: https://github.com/mochajs/mocha/wiki/Third-party-reporters

var timeoutOnExit = null;
const messages = [];
// const tableRows = [];
const tableRows = {};
const integrantHash = {};
const config = global.sumanConfig;
const timestamp = global.timestamp;
var doneCount = 0;
var tableCount = 0;
var listening = true;
var forkedCount = 0;
var processId = 1;
var server, startTime, endTime, networkLog, allFiles = [], forkedCPs = [],
    handleBlocking, depContainerObj = null;

var queuedCpsObj = {
    queuedCPs: []
};

process.on('beforeExit', function () {

});


process.on('exit', function (code, signal) {

    if (typeof process.send === 'function') {
        throw new Error('Runner process should have no parent process.')
    }
    if (signal) {
        runnerLogger.log('\n <::::::::::::::::::::: ' + signal + ' ::::::::::::::::::::::::>');
    }

    //TODO: should this be fs.appendFileSync instead?
    global.sumanStderrStream.write('\n\n\n### Suman runner end ###\n\n\n\n\n\n\n\n\n');
    runnerLogger.log('\n\n\n   <::::::::::::::::::::::::::::::::: suman runner exiting with exit code: ' + util.inspect(code) +
        ' ::::::::::::::::::::::::::::::::::>\n\n');
});


process.on('error', function (err) {
    runnerLogger.log('error in runner:\n' + err.stack);
    //TODO: add process.exit(special code);
});


process.on('uncaughtException', function (msg) {

    runnerLogger.log('\n\n=> Suman runner uncaughtException...\n' + (msg.stack || msg));
    //TODO: add process.exit(special code);

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
            colors.blue.bold.bgYellow(' \u2718  => test fail ') + '  "' +
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
                chalk.green(' \u2714 ') + ' \'' + test.desc + '\' ' + (test.dateComplete ? '(' + ((test.dateComplete - test.dateStarted) || '< 1') + 'ms)' : '') + '\n');

            //TODO: allow printing of just one line of results, until a failure
            //readline.clearLine(process.stdout, 0);
            //process.stdout.write('\r' + chalk.green('Pass count: ' + successCount));

        }
    }
}

function handleTableData(n, data) {

    tableCount++;
    tableRows[n.shortTestPath].tableData = data;
    n.send({
        info: 'table-data-received'
    });

}

function logTestData(data) {

    // if (setup.usingLiveSumanServer) {
    //     networkLog.sendTestData(data);
    // }
    // else {

    throw new Error('this should not be used currently');

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

var called = false;

function makeExit(messages, timeDiff) {

    if (!called) {
        called = true;
    }
    else {
        return;
    }

    console.log('\n\n\n\tTable count:', tableCount);
    console.log('\tDone count:', doneCount);

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

    //TODO: need to reconcile this with tests files that do not complete

    const anyResults = Object.keys(tableRows).map(function (key) {
        return tableRows[key];
    }).filter(function (tr) {
        return tr.tableData;
    });

    if (anyResults.length > 0) {

        table1.setHeading.apply(table1, Object.keys(anyResults[0].tableData));

        Object.keys(tableRows).forEach(function (key) {

            const item = tableRows[key];

            if (item.tableData) {
                // if (item.actualExitCode !== item.tableData['exit-code']) {
                //     console.error(' => Suman internal error => actual exit code differs from table data exit code.');
                // }
                item.tableData['SUITES => '] = item.defaultTableData['SUITES => '];
                item.tableData['exit-code'] = item.actualExitCode;
                table1.addRow.apply(table1, Object.keys(item.tableData).map(key => item.tableData[key]));
            }
            else {
                item.defaultTableData['exit-code'] = item.actualExitCode;
                table1.addRow.apply(table1, Object.keys(item.defaultTableData).map(key => item.defaultTableData[key]));
            }

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
            }],

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
        console.log(err.stack);
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
                handleTableData(n, msg.data);
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
                    colors.bgBlack.white(' '),
                    colors.bgBlack.white(' (note that despite this error, other test processes will continue running, as would be expected.)'),
                    colors.bgBlack.white(' '),
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
    const args = [].concat('--suman').concat('--$runner').concat('--ts').concat(timestamp);

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
                dir = path.resolve(root + '/' + dir); //TODO fix this path?
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
                console.log(err.stack);
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

                    const fileName = String(file);

                    file = path.resolve(dir + '/' + file);

                    var stat;

                    try {
                        stat = fs.statSync(file)
                    }
                    catch (err) {
                        console.error(err.stack);
                        return;
                    }

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

    files.forEach(function (fileShortAndFull) {

        const file = fileShortAndFull[0];
        const shortFile = fileShortAndFull[1];

        tableRows[shortFile] = {
            actualExitCode: null,
            shortFilePath: shortFile,
            tableData: null,
            defaultTableData: {
                'SUITES => ': path.basename(shortFile),
                'Root Suite Name': '(unknown)',
                '*total ': ' -',
                '*skipped ': ' -',
                'TEST CASES =>': '',
                '+total': ' -',
                '+skipped': ' -',
                '+stubbed': ' -',
                '+passed': ' -',
                '+failed': ' -',
                'OVERALL =>': '(not received)',
                'millis': ' -',
                'exit-code': ' -'
            }

        };

        var argz = JSON.parse(JSON.stringify(args));

        function run() {

            argz.push('--fp');
            argz.push(file);

            const execArgz = ['--expose-gc', '--harmony'];

            if (weAreDebugging) {
                if (!global.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
                    execArgz.push('--debug-brk');
                }
                execArgz.push('--debug=' + (5303 + processId++));
            }


            ext = _.merge({}, {
                cwd: global.sumanOpts.force_cwd_to_be_project_root ? root : path.dirname(file),  //TODO: improve this logic
                silent: !(global.sumanOpts.no_silent === true),
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

            if (global.sumanOpts.no_silent !== true) {

                n.stdio[2].setEncoding('utf-8');
                // n.stdio[2].pipe(global.sumanStderrStream);

                n.stdio[2].on('data', function (data) {


                    const d = String(data).split('\n').map(function (line) {
                        return '[' + n.testPath + '] ' + line;
                    }).join('\n');

                    global.sumanStderrStream.write('\n\n');
                    global.sumanStderrStream.write(d);

                    if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                        //TODO: go through code and make sure that no console.log statements should in fact be console.error
                        console.log(d);
                    }


                });

                n.stdio[1].setEncoding('utf-8');
                // n.stdio[2].pipe(global.sumanStderrStream);

                n.stdio[1].on('data', function (data) {

                    const d = String(data).split('\n').map(function (line) {
                        return '[' + n.shortTestPath + '] ' + line;
                    }).join('\n');

                    global.sumanStdoutStream.write('\n\n');
                    global.sumanStdoutStream.write(d);

                    if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                        //TODO: go through code and make sure that no console.log statements should in fact be console.error
                        console.log('Child stdout from [' + n.shortTestPath + ']', d);
                    }
                });


            }

            n.on('exit', function (code, signal) {

                // console.log(n.testPath + ' exited with code: ' + code);
                n.removeAllListeners();
                doneCount++;
                messages.push({code: code, signal: signal});
                tableRows[n.shortTestPath].actualExitCode = code;

                //TODO: if bail, need to make that clear to user here
                if ((code > 0 && global.sumanOpts.bail) || (doneCount >= forkedCPs.length && queuedCpsObj.queuedCPs.length < 1)) {
                    endTime = Date.now();
                    listening = false;
                    setImmediate(function () {
                        makeExit(messages, endTime - startTime);
                    });
                }
                else {
                    const testPath = n.testPath;
                    handleBlocking.releaseNextTests(testPath, queuedCpsObj);
                }
            });


        }

        run.testPath = file;
        run.shortTestPath = shortFile;

        if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
            queuedCpsObj.queuedCPs.push(run);
            // argz.push('--blocked');
            if (process.env.NODE_ENV === 'dev_local_debug') {
                console.log('File is blocked =>', file);
            }
        }
        else {
            run();
            if (process.env.NODE_ENV === 'dev_local_debug') {
                console.log('File is running =>', file);
            }
        }

    });

    const totalCount = forkedCPs.length + queuedCpsObj.queuedCPs.length;
    var suites = totalCount === 1 ? 'suite' : 'suites';
    var processes = totalCount === 1 ? 'process' : 'processes';
    //TODO: add info to demonstrate initial set running, vs total set that will be run
    //TODO: only show extra info if necessary
    runnerLogger.log('\n\n\t => initial set => ' + forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + '\n');
    const addendum = config.maxParallelProcesses < totalCount ? ' with no more than ' + config.maxParallelProcesses + ' running at a time.' : '';
    runnerLogger.log('\t => overall => ' + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + suites + addendum + '\n\n\n');

}


function findTestsAndRunThem(dirs, sumanGroup, grepFile, grepSuite, runOnce, $order) {


    handleBlocking = makeHandleBlocking(_.mapValues($order, function (val) {
        val.testPath = path.resolve(root + '/' + val.testPath);
        return val;
    }));

    const d = domain.create();

    d.once('error', function (err) {
        console.log(err.stack);
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


