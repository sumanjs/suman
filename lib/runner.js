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
// const Immutable = require('immutable');
const async = require('async');
const _ = require('lodash');
const ijson = require('siamese');
const readline = require('readline');
const colors = require('colors/safe');
const debug = require('debug')('suman:core');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;
var makeBeep = require('make-beep');


//#project
const dual = require('./dual/shared');
const constants = require('../config/suman-constants');
const finalizeOutput = require('./finalize-output')();
const ascii = require('./ascii');
const sumanUtils = require('./utils');
const runnerLogger = require('./sync-logger');
const makeHandleBlocking = require('./runner-helpers/make-handle-blocking');
const getFilePaths = require('./runner-helpers/get-file-paths');

//////////////////////////////////////////////
const testResultsEmitter = new EE();
const cwd = process.cwd();
const root = sumanUtils.findProjectRoot(cwd);
const maxProcs = global.maxProcs;

//TODO: https://github.com/mochajs/mocha/wiki/Third-party-reporters

var timeoutOnExit = null;
const messages = [];
// const tableRows = [];
const tableRows = {};
const integrantHash = {};
const integrantHashKeyValsForSumanOncePost = {};
const userData = {}; // user will send data to runner for any/all tests, once before they exit
const postHash = {};
const config = global.sumanConfig;
const timestamp = global.timestamp;
var doneCount = 0;
var tableCount = 0;
var listening = true;
var forkedCount = 0;
var processId = 1;
var server, startTime, endTime, networkLog, files, forkedCPs = [],
    handleBlocking, depContainerObj = null, bailed = false;


var oncePostModule = null;

var queuedCpsObj = {
    queuedCPs: []
};

process.on('beforeExit', function () {
    console.log(' ========> Before exit in the runner.');
});

process.on('exit', function (code, signal) {

    if (signal) {
        runnerLogger.log('\n <::::::::::::::::::::: Runner Exit Signal => ' + signal + ' ::::::::::::::::::::::::>');
    }

    if (code > 0 || true) {
        // console.log('make beep about to be called...');
        makeBeep(2);
    }

    //TODO: should this be fs.appendFileSync instead?
    global.sumanStderrStream.write('\n\n\n### Suman runner end ###\n\n\n\n\n\n\n\n\n');
    runnerLogger.log('\n\n\n   <::::::::::::::::::::::::::::::::: Suman runner exiting with exit code: ' + util.inspect(code) +
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

function logTestResult(data, n) {

    const test = data.test;

    dual.broadcastOrWrite('test-case-end', test);

    if (test.errorDisplay) {
        dual.broadcastOrWrite('test-case-fail', test,
            '\n\n\t' + colors.bgWhite.black.bold(' \u2718  => test fail ') + '  "' +
            test.desc + '"\n' + chalk.yellow(util.inspect(test.errorDisplay)) + '\n\n');
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

function mapCopy(copy) {
    return Object.keys(copy).map(key => {
        const val = copy[key];
        return val.value ? val.value : val.default;
    });
}

function makeExit(messages, timeDiff) {

    if (process.env.SUMAN_DEBUG == 'yes') {
        console.log('\n\n\n\tTable count:', tableCount);
        console.log('\tDone count:', doneCount);
    }

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

    const table1 = new AsciiTable('Suman Runner Results');
    const table2 = new AsciiTable('Overall Stats');

    //TODO: need to reconcile this with tests files that do not complete

    const keys = Object.keys(tableRows);

    // const anyResults = keys.map(function (key) {
    // 	return tableRows[key];
    // }).filter(function (tr) {
    // 	return tr.tableData;  //we only iterate o
    // });

    const totals = {
        SUMAN_IGNORE: '',
        bailed: bailed ? 'YES' : 'no',
        suitesPassed: 0,
        suitesFailed: 0,
        testsPassed: 0,
        testsFailed: 0,
        testsSkipped: 0,
        testsStubbed: 0,
        allTests: 0,
        totalTime: timeDiff
    };

    const constantTableData = constants.tableData;

    table1.setHeading.apply(table1, Object.keys(constantTableData).map(key => constantTableData[key].name));

    const storeRowsHereIfUserWantsSortedData = [];

    keys.forEach(function (key) {

        const item = tableRows[key];
        const tableDataFromCP = item.tableData;
        const copy = JSON.parse(JSON.stringify(constantTableData));
        copy.SUITES_DESIGNATOR.value = item.defaultTableData.SUITES_DESIGNATOR;
        const actualExitCode = copy.TEST_SUITE_EXIT_CODE.value = item.actualExitCode;

        // const fileName = item.defaultTableData.SUITES_DESIGNATOR;
        //
        // const l = fileName.length;
        // item.tableData['SUITES => '] = l > 15 ? '...' + fileName.substring(Math.max(0, l - 12), l - 1) : fileName;

        var obj;
        if (tableDataFromCP) {

            Object.keys(tableDataFromCP).forEach(function (key) {
                const val = tableDataFromCP[key];
                if (copy[key] && !copy[key].value) {  //if value is not already set
                    copy[key].value = val;
                }
            });

            if (actualExitCode === 0) {
                totals.suitesPassed++;
            }
            else {
                totals.suitesFailed++;
            }

            totals.testsPassed += tableDataFromCP.TEST_CASES_PASSED;
            totals.testsFailed += tableDataFromCP.TEST_CASES_FAILED;
            totals.testsSkipped += tableDataFromCP.TEST_CASES_SKIPPED;
            totals.testsStubbed += tableDataFromCP.TEST_CASES_STUBBED;
            totals.allTests += tableDataFromCP.TEST_CASES_TOTAL;

            obj = mapCopy(copy);

            if (global.sumanOpts.sort_by_millis) {
                storeRowsHereIfUserWantsSortedData.push(copy);
            }

            table1.addRow.apply(table1, obj);
        }
        else {

            obj = mapCopy(copy);

            if (global.sumanOpts.sort_by_millis) {
                storeRowsHereIfUserWantsSortedData.push(copy);
            }

            totals.suitesFailed++; //TODO: possible that table data was not received, but exit code was still 0?
            table1.addRow.apply(table1, obj);
        }

    });

    console.log('\n\n');
    var str1 = table1.toString();
    str1 = '\t' + str1;
    console.log(str1.replace(/\n/g, '\n\t'));
    console.log('\n');

    if (global.sumanOpts.sort_by_millis) {

        const tableSortedByMillis = new AsciiTable('Suman Runner Results - sorted by millis');

        tableSortedByMillis.setHeading.apply(tableSortedByMillis, Object.keys(constantTableData).map(key => constantTableData[key].name));

        _.sortBy(storeRowsHereIfUserWantsSortedData, function (item) {
            return item.TEST_SUITE_MILLIS.value;
        }).map(function (item) {
            return mapCopy(item);
        }).forEach(function (obj) {
            tableSortedByMillis.addRow.apply(tableSortedByMillis, obj);
        });

        console.log('\n\n');
        var strSorted = tableSortedByMillis.toString();
        strSorted = '\t' + strSorted;
        console.log(strSorted.replace(/\n/g, '\n\t'));
        console.log('\n');

    }

    table2.setHeading('Totals =>', 'Bailed?', 'Files Passed', 'Files Failed', 'Tests Passed',
        'Tests Failed', 'Tests Skipped', 'Tests Stubbed', 'All Tests', 'Total Time');
    table2.addRow(Object.keys(totals).map(key => totals[key]));

    console.log('\n');
    var str2 = table2.toString();
    str2 = '\t' + str2;
    console.log(str2.replace(/\n/g, '\n\t'));
    console.log('\n');

    async.parallel([function (cb) {

            if (true) {
                process.nextTick(cb);
            }
            else {
                finalizeOutput.makeComplete({
                        usingLiveSumanServer: global.usingLiveSumanServer || false, //TODO
                        timestamp: timestamp,
                        config: config,
                        allFiles: files,
                        server: server
                    },
                    function (err) {
                        if (err) {
                            runnerLogger.log(err.stack || err);
                        }
                        cb(null);
                    });
            }

        }],

        function complete(err, results) {
            process.exit(exitCode);
        });

}


const oncePosts = {};
var oncePostModuleRet = null;
var hasOncePostFile = false;
const allOncePostKeys = [];
var innited = false;

function handleIntegrantInfo(msg, n) {

    const oncePostKeys = msg.oncePost;
    //we want send back onlyPosts immediately because if we wait it blocks unnecessarily

    assert(Array.isArray(oncePostKeys), 'oncePostKeys is not an array type.');
    allOncePostKeys.push(oncePostKeys);

    if (process.env.SUMAN_DEBUG === 'yes') {
        console.log(' => Recevied integrant info msg =>', util.inspect(msg), '\nfrom testPath => ', n.testPath);
    }

    process.nextTick(function () {
        n.send({
            info: 'once-post-received'
        });
    });


    if (oncePostKeys.length > 0 && !innited) {
        try {
            innited = true; //we only want to run this logic once
            oncePostModule = require(path.resolve(global.sumanHelperDirRoot + '/suman.once.post.js'));
            assert(typeof  oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
            hasOncePostFile = true;
        }
        catch (err) {
            console.error(' => Suman usage warning => you have suman.once.post data defined, but no suman.once.post.js file.');
            console.error(err.stack);
        }

    }

    const integrants = msg.msg;

    if (process.env.SUMAN_DEBUG === 'yes') {
        console.log(' => integrants received =>', util.inspect(msg));
    }

    integrants.forEach(function (intg) {

        if (!(String(intg) in integrantHash)) {
            integrantHash[String(intg)] = [];
            integrantHash[String(intg)].push(n);   //store cps in hash, with integrant names as keys
            setTimeout(function () {
                verifyIntegrant(intg);
            }, 10);
        }
        else if (String(integrantHash[intg]).toUpperCase() === 'READY') {

            if (process.env.SUMAN_DEBUG === 'yes') {
                console.log(' => integrants READY =>', util.inspect(msg));
            }

            n.send({info: 'integrant-ready', data: intg, val: integrantHashKeyValsForSumanOncePost[intg]});
        }
        else if (integrantHash[intg] instanceof Error) {

            if (process.env.SUMAN_DEBUG === 'yes') {
                console.log(' => integrants error =>', util.inspect(integrantHash[intg]));
            }

            n.send({info: 'integrant-error', data: integrantHash[intg].stack});
        }
        else if (Array.isArray(integrantHash[intg])) {

            if (process.env.SUMAN_DEBUG === 'yes') {
                console.log(' => child process with filePath =>', n.testPath, '\n is being push to integrants array value for key =>', intg);
            }

            integrantHash[intg].push(n);
        }
        else {
            throw new Error('Unknown state of integrant readiness for integrant key => "' + intg + '",\n\n => ' + util.inspect(integrantHash));
        }

    });

}


const callbackOrPromise = require('./callback-or-promise');

function beforeExitRunOncePost(cb) {

    if (!hasOncePostFile) {
        return process.nextTick(cb);
    }

    const flattenedAllOncePostKeys = _.uniq(_.flatten(allOncePostKeys));
    userData['suman.once.pre.js'] = integrantHashKeyValsForSumanOncePost;
    const oncePostModuleRet = oncePostModule.apply(null, [userData]);

    flattenedAllOncePostKeys.forEach(function (k) {
        //we store an integer for analysis/program verification, but only really need to store a boolean
        //for existing keys we increment by one, otherwise assign to 1
        oncePosts[k] = oncePosts[k] || oncePostModuleRet[k];


        if (typeof oncePosts[k] !== 'function') {

            console.log(' => Suman is about to conk out =>\n\n' +
                ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', oncePosts);

            throw new Error(' => Suman usage warning => your suman.once.post.js ' +
                'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"');

        }
    });

    console.log('\n\n\n', ' => Suman message => All child processes exited.\n');

    const keys = Object.keys(oncePosts);
    if (keys.length) {
        console.log('\n', ' => Suman message => Suman is now running the desired hooks in suman.once.post.js, which include => \n\t', colors.cyan(util.inspect(keys)));
    }

    async.eachSeries(keys, function (k, cb) {

        callbackOrPromise(k, oncePosts, cb);

    }, function (err) {
        if (err) {
            console.error(err.stack || err);
            cb(err);
        }
        else {
            console.log('\n\n', ' => Suman message => all suman.once.post.js hooks completed successfully...exiting...\n\n', '\n\n');
            process.nextTick(function () {
                cb(null);
            });
        }
    });

}


function verifyIntegrant(intg) {

    const d = domain.create();

    d.once('error', function (err) {
        console.log(err.stack);
        const cps = integrantHash[intg];
        integrantHash[intg] = err;
        // cps.forEach(function (cp) {
        //TODO cps does not seem to be an array here
        //     cp.send({info: 'integrant-error', data: err});
        // });
        throw new Error('Integrant information requested is not present in suman.once.js => ' + intg + '\n' + (err.stack || err));
    });

    function sendOutMsg(val) {

        const cps = integrantHash[intg];
        integrantHash[intg] = 'READY';
        integrantHashKeyValsForSumanOncePost[intg] = val;

        if (sumanUtils.isSumanDebug()) {
            console.log(' => sending out READY message for integrant = "' + intg + '" to the following cps => \n', cps.map(function (cp) {
                return cp.testPath;
            }));
        }

        cps.forEach(function (cp) {
            cp.send({info: 'integrant-ready', data: intg, val: val});
        });

    }

    d.run(function () {
        process.nextTick(function () {
            const fn = depContainerObj[intg];
            assert(typeof fn === 'function', 'Integrant listing is not a function => ' + intg);
            if (fn.length > 0) {
                fn.apply(global, [function (err, val) {
                    if (err) {
                        //TODO: fix this, need to handle error properly
                        throw err;
                    }
                    else {
                        // TODO: assert that value has been serialized (string, number, boolean, etc)
                        sumanUtils.runAssertionToCheckForSerialization(val);
                        sendOutMsg(val);
                    }
                }]);
            }
            else {
                Promise.resolve(fn.apply(global, [])).then(function (val) {
                    // TODO: assert that value has been serialized (string, number, boolean, etc)
                    sumanUtils.runAssertionToCheckForSerialization(val);
                    sendOutMsg(val);
                }, function (err) {
                    throw err;
                });
            }
        });
    });
}

function handleMessageForSingleProcess(msg, n) {

    if (listening) {

        switch (msg.type) {

            case constants.runner_message_type.TABLE_DATA:
                // handleTableData(n, msg.data);
                break;

            //TODO: shouldn't integrants for single process be handled differently than multi-process?
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
                    colors.bgMagenta.white.bold(' => Suman runner => there was a fatal test suite error - an error was encountered in your test code that prevents Suman'),
                    colors.bgMagenta.white.bold(' from continuing with a particular test suite with the following path:'),
                    ' ',
                    colors.bgWhite.black.bold(' => ' + n.testPath + ' '),
                    ' ', //colors.bgBlack.white(' '),
                    (function () {
                        if (!global.sumanOpts.sparse) {
                            return colors.grey('(note that despite this fatal error, other test processes will continue running, as would be expected, use the ' + colors.cyan('--bail') + ' option, if you wish otherwise.)');
                        }
                        return null;
                    })(),
                    ' ', //colors.bgBlack.white(' '),
                    colors.magenta.bold(String(msg.error ? msg.error : JSON.stringify(msg)).replace(/\n/g, '\n\t')),
                    '\n\n'
                ].filter(item => item); //filter out null/undefined

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
                throw new Error('Suman internal error => bad msg.type in runner');
        }

    }
    else {
        throw new Error('Suman internal error => this definitely shouldn\'t happen');
    }
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
                logTestResult(msg, n);
                break;
            case constants.runner_message_type.FATAL_SOFT:
                runnerLogger.log('\n\n' + colors.grey(' => Suman warning => ') + colors.magenta(msg.msg) + '\n');
                break;
            case constants.runner_message_type.FATAL:

                //TODO: need to make sure this is only called once per file
                //TODO: https://www.dropbox.com/s/qbak4a9bgml31jx/Screenshot%202016-04-09%2017.20.57.png?dl=0

                msg = msg.data;

                const message = [
                    colors.bgMagenta.white.bold(' => Suman runner => there was a fatal test suite error - an error was encountered in your test code that prevents Suman'),
                    colors.bgMagenta.white.bold(' from continuing with a particular test suite with the following path:'),
                    ' ',
                    colors.bgWhite.black.bold(' => ' + n.testPath + ' '),
                    ' ', //colors.bgBlack.white(' '),
                    (function () {
                        if (!global.sumanOpts.sparse) {
                            return colors.grey('(note that despite this fatal error, other test processes will continue running, as would be expected, use the ' + colors.cyan('--bail') + ' option, if you wish otherwise.)');
                        }
                        return null;
                    })(),
                    ' ', //colors.bgBlack.white(' '),
                    colors.magenta.bold(String(msg.error ? msg.error : JSON.stringify(msg)).replace(/\n/g, '\n\t')),
                    '\n\n'
                ].filter(item => item); //filter out null/undefined

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

function runSumanGroup(sumanGroup) {

    // TODO

}

function runAllTestsInSingleProcess(dirs) {

    const args = ['--suman', '--$runner', '--ts', timestamp];

    const match = global.sumanMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));
    const notMatch = global.sumanNotMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));

    dirs = _.flatten([dirs]);  //handle if dirs is not an array
    files = getFilePaths(dirs, match, notMatch);

    //TODO: * character might not be good enough

    const SUMAN_SINGLE_PROCESS_FILES = JSON.stringify(sumanUtils.removeSharedRootPath(files));

    console.log('FILES:', SUMAN_SINGLE_PROCESS_FILES);

    startTime = Date.now();

    const sumanEnv = Object.assign({}, process.env, {
        SUMAN_CONFIG: JSON.stringify(global.sumanConfig),
        SUMAN_OPTS: JSON.stringify(global.sumanOpts),
        SUMAN_SINGLE_PROCESS_FILES: SUMAN_SINGLE_PROCESS_FILES,
        SUMAN_SINGLE_PROCESS: 'yes'
    });

    if (global.sumanOpts.register) {
        args.push('--register');
    }

    const execArgz = ['--expose-gc', '--harmony', '--expose_debug_as=v8debug'];

    if (weAreDebugging) {
        if (!global.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
            execArgz.push('--debug-brk');
        }
        execArgz.push('--debug=' + (5303 + processId++));
    }

    const ext = _.merge({}, {
        cwd: root,  //TODO: improve this logic
        silent: !(global.sumanOpts.no_silent === true),
        execArgv: execArgz,
        env: sumanEnv,
        // uid: gid++,
        detached: false   //TODO: detached:false works but not true
    });

    const n = cp.fork(path.resolve(__dirname + '/run-child.js'), args, ext);

    n.on('message', function (msg) {
        handleMessageForSingleProcess(msg, n);
    });

    n.on('error', function (err) {
        throw new Error(err.stack);
    });

    if (global.sumanOpts.no_silent !== true) {

        n.stdio[2].setEncoding('utf-8');
        // n.stdio[2].pipe(global.sumanStderrStream);
        n.stdio[2].on('data', function (data) {

            const d = String(data).split('\n').map(function (line) {
                return '[' + '???' + '] ' + line;
            }).join('\n');

            global.sumanStderrStream.write('\n\n');
            global.sumanStderrStream.write(d);

            if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                //TODO: go through code and make sure that no console.log statements should in fact be console.error
                console.log(d);
            }

        });

    }

    n.on('exit', function (code, signal) {

        if (process.env.SUMAN_DEBUG === 'yes') {
            console.log('\n', colors.black.bgYellow(' => process given by => ' + n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
        }

        if (process.env.SUMAN_DEBUG === 'yes') {
            global.timeOfMostRecentExit = Date.now();
        }

        n.removeAllListeners();

        doneCount++;
        messages.push({code: code, signal: signal});
        // tableRows[n.shortTestPath].actualExitCode = code;

        //TODO: if bail, need to make that clear to user here

        listening = false;
        setImmediate(function () {
            beforeExitRunOncePost(function (err) {
                makeExit(messages, Date.now() - startTime);
            });
        });

    });

}

function runSingleOrMultipleDirs(dirs) {

    const args = ['--suman', '--$runner', '--ts', timestamp];

    // const grepFile = global.sumanOpts.grep_file;
    // const grepFileBaseName = global.sumanOpts.grep_file_base_name;

    const match = global.sumanMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));
    const notMatch = global.sumanNotMatches.map(item => (item instanceof RegExp) ? item : new RegExp(item));


    if (global.sumanOpts.verbose || process.env.SUMAN_DEBUG === 'yes') {
        console.log(' => Test files will be run if they match any of:', match);
        console.log(' => But test files will *not* run if they match any of:', notMatch);
    }

    if (global.usingLiveSumanServer) {
        args.push('--live_suman_server');
    }

    //TODO: optimize this by only parsing/stringifying once (args are copied below)
    // args.push('--suman-config');
    // args.push(JSON.stringify(global.sumanConfig));
    //
    // args.push('--suman-opts');
    // args.push(JSON.stringify(global.sumanOpts));

    dirs = _.flatten([dirs]);  //handle if dirs is not an array

    files = getFilePaths(dirs, match, notMatch);

    if (global.sumanOpts.rand) {

        files = _.shuffle(files);

        console.log('sorted randomly!');
    }

    //TODO: need to make sure list of files is unique list, if not report that as non-fatal error

    handleBlocking.determineInitialStarters(files);
    startTime = Date.now();

    const fileObjArray = sumanUtils.removeSharedRootPath(files);

    var gid = 2;

    const sumanEnv = Object.assign({}, process.env, {
        SUMAN_CONFIG: JSON.stringify(global.sumanConfig),
        SUMAN_OPTS: JSON.stringify(global.sumanOpts)
    });

    fileObjArray.forEach(function (fileShortAndFull) {

        const file = fileShortAndFull[0];
        const shortFile = fileShortAndFull[1];

        const basename = path.basename(file);

        tableRows[shortFile] = {
            actualExitCode: null,
            shortFilePath: shortFile,
            tableData: null,
            defaultTableData: {
                SUITES_DESIGNATOR: basename.length > 20 ? '...'
                + String(basename).substring(Math.max(0, basename.length - 20)) : basename
            }
        };

        const argz = JSON.parse(JSON.stringify(args));

        function run() {

            argz.push('--fp');
            argz.push(file);

            if (global.sumanOpts.register) {
                argz.push('--register');
            }

            const execArgz = ['--expose-gc', '--harmony'];

            if (weAreDebugging) {
                if (!global.sumanOpts.ignore_break) {  //NOTE: this allows us to focus on debugging runner
                    execArgz.push('--debug-brk');
                }
                execArgz.push('--debug=' + (5303 + processId++));
            }

            const ext = _.merge({}, {
                cwd: global.sumanOpts.force_cwd_to_be_project_root ? root : path.dirname(file),  //TODO: improve this logic
                silent: !(global.sumanOpts.no_silent === true),
                execArgv: execArgz,
                env: sumanEnv,
                // uid: gid++,
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
                        return '[' + n.shortTestPath + '] ' + line;
                    }).join('\n');

                    global.sumanStderrStream.write('\n\n');
                    global.sumanStderrStream.write(d);

                    if (weAreDebugging) {  //TODO: add check for NODE_ENV=dev_local_debug
                        //TODO: go through code and make sure that no console.log statements should in fact be console.error
                        console.log(d);
                    }

                });

                /*
                 n.stdio[1].setEncoding('utf-8');
                 n.stdio[1].on('data', function (data) {

                 const d = String(data).split('\n').map(function (line) {
                 return '[' + n.shortTestPath + '] ' + line;
                 }).join('\n');

                 global.sumanStdoutStream.write('\n\n');
                 global.sumanStdoutStream.write(d);

                 if (weAreDebugging || process.env.SUMAN_DEBUG == 'on') {  //TODO: add check for NODE_ENV=dev_local_debug
                 //TODO: go through code and make sure that no console.log statements should in fact be console.error
                 console.log('Child stdout from [' + n.shortTestPath + ']', d);
                 }
                 });*/

            }

            n.on('exit', function (code, signal) {

                if (process.env.SUMAN_DEBUG === 'yes') {
                    console.log('\n', colors.black.bgYellow(' => process given by => ' + n.shortTestPath + ' exited with code: ' + code + ' '), '\n');
                }

                if (process.env.SUMAN_DEBUG === 'yes') {
                    global.timeOfMostRecentExit = Date.now();
                }

                n.removeAllListeners();

                doneCount++;
                messages.push({code: code, signal: signal});
                tableRows[n.shortTestPath].actualExitCode = code;

                //TODO: if bail, need to make that clear to user here
                if ((bailed = (code > 0 && global.sumanOpts.bail)) || (doneCount >= forkedCPs.length && queuedCpsObj.queuedCPs.length < 1)) {
                    endTime = Date.now();
                    listening = false;
                    setImmediate(function () {
                        beforeExitRunOncePost(function (err) {
                            makeExit(messages, endTime - startTime);
                        });
                    });
                }
                else {
                    const testPath = n.testPath;
                    handleBlocking.releaseNextTests(testPath, queuedCpsObj);
                    if (process.env.SUMAN_DEBUG === 'yes') {
                        console.log(' => Time required to release next test(s) => ', Date.now() - global.timeOfMostRecentExit, 'ms');
                    }
                }
            });

        }

        run.testPath = file;
        run.shortTestPath = shortFile;

        if (handleBlocking.shouldFileBeBlockedAtStart(file)) {
            queuedCpsObj.queuedCPs.push(run);
            // argz.push('--blocked');
            if (process.env.SUMAN_DEBUG == 'on') {
                console.log('File is blocked =>', file);
            }
        }
        else {
            run();
            if (process.env.SUMAN_DEBUG == 'on') {
                console.log('File is running =>', file);
            }
        }

    });

    if (forkedCPs.length < 1 && queuedCpsObj.queuedCPs.length > 0) {
        throw new Error(' => Suman internal error => fatal start order algorithm error, please file an issue on Github, thanks.');
    }

    if (forkedCPs.length < 1) {
        console.log('\n', colors.magenta(' => Suman message => No test files were found in the directories provided'), '\n',
            ' => dirs => ', colors.bgWhite.black.bold(JSON.stringify(dirs)), '\n\n\n',
            colors.bgBlack.yellow.bold(' => perhaps you should use the --recursive option?'), '\n');
        process.exit(1);
    }
    else {
        const totalCount = forkedCPs.length + queuedCpsObj.queuedCPs.length;
        var suites = totalCount === 1 ? 'suite' : 'suites';
        var processes = totalCount === 1 ? 'process' : 'processes';
        //TODO: add info to demonstrate initial set running, vs total set that will be run
        //TODO: only show extra info if necessary
        runnerLogger.log('\n\n\t ' + colors.bgWhite.blue(' => [Suman runner] =>  initial set => ' + forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' ') + '\n');
        const addendum = maxProcs < totalCount ? ' with no more than ' + maxProcs + ' running at a time.' : '';
        runnerLogger.log('\t ' + colors.bgWhite.blue(' => [Suman runner] =>  overall set => ' + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + suites + addendum + ' ') + '\n\n\n');

    }

    if (global.sumanOpts.errors_only) {
        console.log('\n', colors.bgGreen.white(' => ' + colors.white.bold('"--errors-only"') + ' option used, hopefully you don\'t see much output until the end :) '), '\n');
    }

}

function findTestsAndRunThem(dirs, sumanGroup, grepFile, grepSuite, runOnce, $order) {

    handleBlocking = makeHandleBlocking(_.mapValues($order, function (val) {
        val.testPath = path.resolve(root + '/' + val.testPath);
        return val;
    }));

    process.nextTick(function () {

        depContainerObj = runOnce();  //TODO: should this be done  before this point in the program?

        runnerLogger.log('\n\n');

        if (dirs) {
            if (sumanGroup) {
                throw new Error('both dirs and sumanGroup defined, you can only choose one.');
            }
        }

        runnerLogger.log(ascii.suman_runner);

        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
            runAllTestsInSingleProcess(dirs);
        }
        else if (dirs) {
            runSingleOrMultipleDirs(dirs);
        }
        else if (sumanGroup) {
            //runSumanGroup(grepFile, sumanGroup);
            throw new Error('Not implemented yet.')
        }
        else {
            throw new Error('no dir or sumanGroup defined.');
        }

    });

}

module.exports = findTestsAndRunThem;


