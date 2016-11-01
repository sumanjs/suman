/**
 * Created by denman on 12/30/2015.
 */

//////////////////////////////////////////////////////////////

var args = JSON.parse(JSON.stringify(process.argv));
var execArgs = JSON.parse(JSON.stringify(process.execArgv));

////////// debugging ///////////////////////////////////////////////

require('./debugging-helper/we-are-debugging');

//////////////////////////////////////////////////////////////////

//#config
const constants = require('../config/suman-constants');

//#core
const fs = require('fs');
const path = require('path');
const domain = require('domain');
const EE = require('events');
const util = require('util');

//#npm
// const tap = require('tap');
const _ = require('lodash');
const readline = require('readline');
const colors = require('colors/safe');
const chalk = require('chalk');
const AsciiTable = require('ascii-table');
const async = require('async');
const fnArgs = require('function-arguments');
const a8b = require('ansi-256-colors'), fg = a8b.fg, bg = a8b.bg;

//#project
const sumanUtils = require('suman-utils/utils');
const finalizeOutput = require('./finalize-output')();
const findSumanServer = require('./find-suman-server');
const ascii = require('./ascii');
const dual = require('./dual/shared');

///////////////////////////////////////////////////////////////////////////////////////

function Suman(obj) {
    this.allDescribeBlocks = [];
    this.interface = obj.interface;
    this.fileName = obj.fileName;
    this.allFiles = obj.allFiles;
    this.server = obj.server;
    this.usingLiveSumanServer = obj.usingLiveSumanServer;
    this.networkLog = obj.networkLog;
    this.outputPath = obj.outputPath;
    this.setup = obj.setup;
    this.timestamp = obj.timestamp;
    this.describeOnlyIsTriggered = false;
    this.deps = null;
}


Suman.prototype.makeExit = function (exitCode) { //TODO this should just be in the on('exit) handler!!

    const self = this;

    async.series([

            function (cb) {
                if (true/*global.usingRunner*/) {
                    process.nextTick(cb);
                }
                else {

                    const d = domain.create();

                    d.once('error', function (err) {
                        console.log(err.stack);
                    });

                    d.run(function () {
                        process.nextTick(function () {
                            finalizeOutput.makeComplete({
                                usingLiveSumanServer: self.usingLiveSumanServer,
                                server: self.server,
                                allFiles: self.allFiles
                            }, function (err) {
                                if (err) {
                                    process.stdout.write(err.stack);
                                }
                                cb(null);
                            });
                        });
                    });
                }
            }
        ],
        function complete(err, results) {
            process.exit(exitCode);  //TODO does this produce the proper exit code?
        });

};

Suman.prototype.log = function (userInput, test) {

    var self = this;

    var data = {
        type: 'USER_LOG',
        userOutput: true,
        testId: test.testId,
        data: userInput,
        outputPath: self.outputPath
    };

    if (process.send) {
        //process.send(data);
    }
    else {

        var json;
        if (this.usingLiveSumanServer) {
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
            // this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {

            console.log(new Error('Suman cannot log your test result data:\n').stack);
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results')
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}
        }
    }
};

Suman.prototype.logFatalSuite = function logFatalSuite(test) {

    const data = {
        'FATAL': {
            testId: test.testId
        }

    };

    if (global.usingRunner) {
        //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted? or can we avoid this if only this process writes to the file?
        //process.send(data);
    }
    else {

        if (this.usingLiveSumanServer) {
            //TODO: we may want to log locally first just to make sure we have the data somewhere
            this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            var json = JSON.stringify(data.test);
            fs.writeFileSync(this.outputPath, '');
        }
        else {
            console.log(new Error('Suman cannot log your test result data:\n').stack);
            //try {
            //    var pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results');
            //    json = JSON.stringify(data);
            //    fs.appendFileSync(pth, json += ',');
            //}
            //catch (err) {
            //    console.error('Suman cannot log your test result data:\n' + err.stack);
            //}

        }
    }
};


Suman.prototype.getTableData = function () {


};


Suman.prototype.logFinished = function ($exitCode, cb) {

    //note: if $exitCode is defined, it should be > 0

    var exitCode = 999; //in case of future fall through

    const desc = this.allDescribeBlocks[0] ? this.allDescribeBlocks[0].desc : 'unknown suite';
    const suiteName = desc.length > 50 ? '...' + desc.substring(desc.length - 50, desc.length) : desc;
    const suiteNameShortened = desc.length > 15 ? desc.substring(0, 12) + '...' : desc;
    var delta = this.dateSuiteFinished - this.dateSuiteStarted;

    const skippedSuiteNames = [];
    var suitesTotal = null;
    var suitesSkipped = null;
    var testsSkipped = null;
    var testsStubbed = null;
    var testsPassed = null;
    var testsFailed = null;
    var totalTests = null;

    if ($exitCode === 0) {

        suitesTotal = this.allDescribeBlocks.length;

        suitesSkipped = this.allDescribeBlocks.filter(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                skippedSuiteNames.push(block.desc);
                return true;
            }
        }).length;

        testsSkipped = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return block.getParallelTests().concat(block.getTests()).length;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return test.skipped || test.skippedDueToOnly;
                }).length;
            }

        }).reduce(function (prev, current) {
            return prev + current;
        });

        testsStubbed = this.allDescribeBlocks.map(function (block) {

            return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                return test.stubbed;
            }).length;

        }).reduce(function (prev, current) {
            return prev + current;
        });

        testsPassed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error == null && test.complete === true;
                }).length;
            }

        }).reduce(function (prev, current) {
            return prev + current;
        });

        testsFailed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error != null;
                }).length;
            }
        }).reduce(function (prev, current) {
            return prev + current;
        });

        totalTests = this.allDescribeBlocks.map(function (block) {

            return block.getParallelTests().concat(block.getTests()).length;

        }).reduce(function (prev, current) {
            return prev + current;
        });

        if (testsFailed > 0) {
            exitCode = constants.EXIT_CODES.TEST_CASE_FAIL;
        }
        else {
            exitCode = constants.EXIT_CODES.SUCCESSFUL_RUN;
        }

    }

    delta = (typeof delta === 'number' && !Number.isNaN(delta)) ? delta : 'N/A';
    const deltaMinues = (typeof delta === 'number' && !Number.isNaN(delta)) ? Number(delta / (1000 * 60)).toFixed(4) : 'N/A';
    const passingRate = (typeof testsPassed === 'number' && typeof totalTests === 'number') ? Number(100 * (testsPassed / totalTests)).toFixed(2) + '%' : 'N/A';

    if (global.usingRunner) {

        const d = {};
        d.ROOT_SUITE_NAME = suiteNameShortened;
        d.SUITE_COUNT = suitesTotal;
        d.SUITE_SKIPPED_COUNT = suitesSkipped;
        d.TEST_CASES_TOTAL = totalTests;
        d.TEST_CASES_FAILED = testsFailed;
        d.TEST_CASES_PASSED = testsPassed;
        d.TEST_CASES_SKIPPED = testsSkipped;
        d.TEST_CASES_STUBBED = testsStubbed;
        d.TEST_SUITE_MILLIS = delta;
        d.OVERALL_DESIGNATOR = 'received';

        const fileName = this.fileName;


        process.nextTick(function () {
            cb(null, {
                exitCode: exitCode,
                tableData: d
            })
        });

    }
    else {

        //TODO: add pass rate as percentage


        const table = new AsciiTable('Results for: ' + suiteName);
        table.setHeading('Metric', '    Value   ', '    Notes   ');
        // table.addRow('Root Suite Title', suiteName, '');
        table.addRow('Total Num. of Test Blocks', suitesTotal, '');  //TODO: this is hardcoded, fix
        table.addRow('Test blocks skipped', suitesSkipped || '-', skippedSuiteNames.length > 0 ? JSON.stringify(skippedSuiteNames) : '');
        table.addRow('Hooks skipped',  '-');
        table.addRow('------------------------',  '--------------','-----------------------------------');
        table.addRow('Tests skipped', testsSkipped || '-');
        table.addRow('Tests stubbed', testsStubbed || '-');
        table.addRow('Tests passed', testsPassed || '-');
        table.addRow('Tests failed', testsFailed || '-');
        table.addRow('Tests total', totalTests || '-');
        table.addRow('------------------------',  '--------------','-----------------------------------');
        table.addRow('Passing rate', passingRate);
        table.addRow('Total time millis (delta)', delta, '                                   -');
        table.addRow('Total time minutes (delta)', deltaMinues, '                                   -');

        //TODO: if root suite is skipped, it is noteworthy

        table.setAlign(0, AsciiTable.LEFT);
        table.setAlign(1, AsciiTable.RIGHT);
        table.setAlign(2, AsciiTable.RIGHT);

        // console.log('\n\n');
        // var str = table.toString();
        // str = '\t' + str;
        // console.log(str.replace(/\n/g, '\n\t'));
        // console.log('\n');

        process.nextTick(function () {
            cb(null, {
                exitCode: exitCode,
                tableData: table
            });
        });

    }

};

Suman.prototype.logData = function logData(test) {

    test.error = test.error || null;

    const result = {
        testId: test.testId,
        desc: test.desc,
        opts: test.opts,
        children: test.getChildren(),
        tests: _.flattenDeep([test.getTests(), test.getParallelTests()])
    };

    if (global.usingRunner) {

        var data = {
            test: result,
            type: 'LOG_DATA',
            outputPath: this.outputPath
        };

        //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted?
        //TODO: or can we avoid this if only this process writes to the file?
        //TODO: note, only one process writes to this file since it is a 1:1 process per file
        // process.send(data);
        try {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        catch (e) {
            console.error(e.stack);
            console.log('test data:', util.inspect(data.test));
        }

    }
    else {

        if (this.usingLiveSumanServer) {
            //TODO: we may want to log locally first just to make sure we have the data somewhere
            // this.networkLog.sendTestData(data);
            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else if (this.outputPath && global.viaSuman === true) {

            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }

    }
};

Suman.prototype.logResult = function (test) {  //TODO: refactor to logTestResult

    //TODO: this function becomes just a way to log to command line, not to text DB

    const config = global.sumanConfig;

    if (global.usingRunner) {

        // only ignore if test has completed (no errors present)
        const ignore = global.sumanOpts.errors_only && test.dateComplete;

        if (!ignore) {
            const _test = {
                cb: test.cb,
                sumanModulePath: global._sumanModulePath,
                error: test.error ? (test.error._message || test.error.stack || test.error) : null,
                errorDisplay: test.errorDisplay,
                mode: test.mode,
                plan: test.plan,
                skip: test.skip,
                stubbed: test.stubbed,
                testId: test.testId,
                only: test.only,
                timedOut: test.timedOut,
                desc: test.desc,
                complete: test.complete,
                dateStarted: test.dateStarted,
                dateComplete: test.dateComplete
            };

            var data = {
                test: _test,
                type: 'LOG_RESULT',
                outputPath: this.outputPath
            };

            var str = JSON.stringify(data);
            str = str.replace(/(\r\n|\n|\r)/gm, ''); ///This javascript code removes all 3 types of line breaks
            process.send(JSON.parse(str));
        }

    }
    else {

        if (this.usingLiveSumanServer) {
            // this.networkLog.sendTestData(data);
        }
        else if (this.outputPath) {
            // var json = JSON.stringify(test);
            // fs.appendFileSync(this.outputPath, json += ',');
        }

        dual.broadcastOrWrite('test-case-end', test);

        if (test.errorDisplay) {
            dual.broadcastOrWrite('test-case-fail', test, '\n\n\t' +
                colors.bgWhite.black.bold(' \u2718  => test fail ') + '  "' +
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

            }

        }
    }
};

function makeSuman($module, _interface, shouldCreateResultsDir, config, cb) {

    const cwd = process.cwd();
    var liveSumanServer = false;

    if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
        liveSumanServer = true;
    }

    if (global.usingRunner && typeof process.send !== 'function') {
        console.log(new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.').stack);
        return process.exit(constants.EXIT_CODES.INVALID_RUNNER_CHILD_PROCESS_STATE);
        // we return just in case, you know, it is JS
    }

    /*

     note: this was removed because when debugging with node-inspector process.send is defined

     if (typeof process.send === 'function' && !usingRunner) {
     const err = new Error('=> Suman fatal error => Inconsistent state => process.send is defined but usingRunner is false.');
     process.send({
     type: constants.runner_message_type.FATAL,
     data: {
     msg: err.stack,
     error: err.stack
     }
     });
     return process.nextTick(function () {
     process.exit(constants.EXIT_CODES.UNKNOWN_RUNNER_CHILD_PROCESS_STATE);
     });
     }

     */

    var timestamp;
    var outputPath = null;
    var networkLog = null;

    if (global.usingRunner) {  //using runner, obviously, so runner provides timestamp value
        timestamp = global.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
        if (!timestamp) {
            console.log(new Error('no timestamp provided by Suman test runner').stack);
            process.exit(constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
        }
    }
    else if (global.timestamp) {  //using suman executable, but not runner
        timestamp = global.timestamp;
    }
    else {  //test file executed with plain node executable
        // timestamp = Date.now();
        timestamp = null;
    }

    //TODO: need to properly toggle the value for 'shouldCreateResultsDir'
    sumanUtils.makeResultsDir(shouldCreateResultsDir && !global.usingRunner, function (err) {

        if (err) {
            console.log(err.stack);
            process.exit(constants.EXIT_CODES.ERROR_CREATING_RESULTS_DIR);
        }
        else {

            const server = findSumanServer(null);

            //TODO: output path name needs to be incremented somehow by test per file, if there is more than 1 test per file
            if (timestamp) {
                outputPath = path.normalize(sumanUtils.getHomeDir() + '/suman/test_results/'
                    + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');
            }

            try {
                fs.unlinkSync(outputPath); //TODO can we remove this unlink call? I guess it's just in case the same timestamp exists..
            }
            catch (err) {
                //console.error(err.stack);
            }

            //TODO: if using runner, the runner should determine if the server is live

            cb(null, new Suman({
                fileName: path.resolve($module.filename),
                outputPath: outputPath,
                usingLiveSumanServer: liveSumanServer,
                networkLog: networkLog,
                server: server,
                allFiles: [$module.filename],
                interface: _interface
            }));

        }

    });
}

module.exports = makeSuman;