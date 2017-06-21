'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require('fs');
var path = require('path');
var domain = require('domain');
var EE = require('events');
var util = require('util');
var flattenDeep = require('lodash.flattendeep');
var readline = require('readline');
var colors = require('colors/safe');
var AsciiTable = require('ascii-table');
var async = require('async');
var fnArgs = require('function-arguments');
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var finalizeOutput = require('./helpers/finalize-output');
var findSumanServer = require('./find-suman-server');
var constants = require('../config/suman-constants').constants;
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var weAreDebugging = require('./helpers/we-are-debugging');
var sumanId = 0;
function Suman(obj) {
    var projectRoot = _suman.projectRoot;
    this.interface = obj.interface;
    this.fileName = obj.fileName;
    this.slicedFileName = obj.fileName.slice(projectRoot.length);
    this.networkLog = obj.networkLog;
    this.outputPath = obj.outputPath;
    this.timestamp = obj.timestamp;
    this.sumanId = ++sumanId;
    this.allDescribeBlocks = [];
    this.describeOnlyIsTriggered = false;
    this.deps = null;
    this.numHooksSkipped = 0;
    this.numHooksStubbed = 0;
    this.numBlocksSkipped = 0;
}
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
    }
    else {
        var json = void 0;
        if (this.usingLiveSumanServer) {
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else if (this.outputPath) {
            json = JSON.stringify(data);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else {
            console.log(new Error('Suman cannot log your test result data:\n').stack);
        }
    }
};
Suman.prototype.getTableData = function () {
    throw new Error('Suman => not yet implemente');
};
function combine(prev, curr) {
    return prev + curr;
}
Suman.prototype.logFinished = function ($exitCode, skippedString, cb) {
    var exitCode = $exitCode || 999;
    var desc = this.rootSuiteDescription;
    var suiteName = desc.length > 50 ? '...' + desc.substring(desc.length - 50, desc.length) : desc;
    var suiteNameShortened = desc.length > 15 ? desc.substring(0, 12) + '...' : desc;
    var delta = this.dateSuiteFinished - this.dateSuiteStarted;
    var skippedSuiteNames = [];
    var suitesTotal = null;
    var suitesSkipped = null;
    var testsSkipped = null;
    var testsStubbed = null;
    var testsPassed = null;
    var testsFailed = null;
    var totalTests = null;
    var completionMessage = ' (implementation error, please report) ';
    if ($exitCode === 0 && skippedString) {
        completionMessage = '(Test suite was skipped)';
        exitCode = 0;
    }
    else if ($exitCode === 0 && !skippedString) {
        completionMessage = 'Ran to completion';
        suitesTotal = this.allDescribeBlocks.length;
        suitesSkipped = this.allDescribeBlocks.filter(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                skippedSuiteNames.push(block.desc);
                return true;
            }
        }).length;
        if (suitesSkipped.length) {
            console.log(' => Suman implementation warning => suites skipped was non-zero outside of suman.numBlocksSkipped value.');
        }
        suitesSkipped += this.numBlocksSkipped;
        testsSkipped = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return block.getParallelTests().concat(block.getTests()).length;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return (test.skipped || test.skippedDueToOnly) && !test.stubbed;
                }).length;
            }
        })
            .reduce(combine);
        testsStubbed = this.allDescribeBlocks.map(function (block) {
            return block.getParallelTests().concat(block.getTests())
                .filter(function (test) {
                return test.stubbed;
            }).length;
        }).reduce(combine);
        testsPassed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error == null && test.complete === true;
                }).length;
            }
        })
            .reduce(combine);
        testsFailed = this.allDescribeBlocks.map(function (block) {
            if (block.skipped || block.skippedDueToOnly) {
                return 0;
            }
            else {
                return block.getParallelTests().concat(block.getTests()).filter(function (test) {
                    return !test.skipped && !test.skippedDueToOnly && test.error;
                }).length;
            }
        })
            .reduce(combine);
        totalTests = this.allDescribeBlocks.map(function (block) {
            return block.getParallelTests().concat(block.getTests()).length;
        })
            .reduce(combine);
        if (testsFailed > 0) {
            exitCode = constants.EXIT_CODES.TEST_CASE_FAIL;
        }
        else {
            exitCode = constants.EXIT_CODES.SUCCESSFUL_RUN;
        }
    }
    else {
        completionMessage = ' Test file errored out.';
    }
    delta = (typeof delta === 'number' && !Number.isNaN(delta)) ? delta : 'N/A';
    var deltaMinutes = (typeof delta === 'number' && !Number.isNaN(delta)) ? Number(delta / (1000 * 60)).toFixed(4) : 'N/A';
    var passingRate = (typeof testsPassed === 'number' && typeof totalTests === 'number' && totalTests > 0) ?
        Number(100 * (testsPassed / totalTests)).toFixed(2) + '%' : 'N/A';
    if (_suman.usingRunner) {
        var d_1 = {
            ROOT_SUITE_NAME: suiteNameShortened,
            SUITE_COUNT: suitesTotal,
            SUITE_SKIPPED_COUNT: suitesSkipped,
            TEST_CASES_TOTAL: totalTests,
            TEST_CASES_FAILED: testsFailed,
            TEST_CASES_PASSED: testsPassed,
            TEST_CASES_SKIPPED: testsSkipped,
            TEST_CASES_STUBBED: testsStubbed,
            TEST_FILE_MILLIS: delta,
            OVERALL_DESIGNATOR: 'received'
        };
        process.nextTick(function () {
            cb(null, {
                exitCode: exitCode,
                tableData: d_1
            });
        });
    }
    else {
        var table_1 = new AsciiTable('Results for: ' + suiteName);
        table_1.setHeading('Metric', '    Value   ', '    Comments   ');
        if (skippedString) {
            table_1.addRow('Status', completionMessage, skippedString);
        }
        else {
            table_1.addRow('Status', completionMessage, '            ');
            table_1.addRow('Num. of Unskipped Test Blocks', suitesTotal, '');
            table_1.addRow('Test blocks skipped', suitesSkipped ? 'At least ' + suitesSkipped : '-', skippedSuiteNames.length > 0 ? JSON.stringify(skippedSuiteNames) : '');
            table_1.addRow('Hooks skipped', this.numHooksSkipped ?
                'At least ' + this.numHooksSkipped : '-', '                                 -');
            table_1.addRow('Hooks stubbed', this.numHooksStubbed ?
                'At least ' + this.numHooksStubbed : '-', '                                 -');
            table_1.addRow('--------------------------', '         ---', '                                 -');
            table_1.addRow('Tests skipped', suitesSkipped ? 'At least ' + testsSkipped : (testsSkipped || '-'));
            table_1.addRow('Tests stubbed', testsStubbed || '-');
            table_1.addRow('Tests passed', testsPassed || '-');
            table_1.addRow('Tests failed', testsFailed || '-');
            table_1.addRow('Tests total', totalTests || '-');
            table_1.addRow('--------------------------', '          ---', '                                 -');
            table_1.addRow('Passing rate', passingRate);
            table_1.addRow('Total time millis (delta)', delta, '                                   -');
            table_1.addRow('Total time minutes (delta)', deltaMinutes, '                                   -');
        }
        table_1.setAlign(0, AsciiTable.LEFT);
        table_1.setAlign(1, AsciiTable.RIGHT);
        table_1.setAlign(2, AsciiTable.RIGHT);
        process.nextTick(function () {
            cb(null, {
                exitCode: exitCode,
                tableData: table_1
            });
        });
    }
};
Suman.prototype.logData = function logData(suite) {
    suite.error = suite.error || null;
    var result = {
        testId: suite.testId,
        desc: suite.desc,
        opts: suite.opts,
        children: suite.getChildren(),
        tests: flattenDeep([suite.getTests(), suite.getParallelTests()])
    };
    if (_suman.usingRunner) {
        var data = {
            test: result,
            type: 'LOG_DATA',
            outputPath: this.outputPath
        };
        try {
            var json = JSON.stringify(data.test);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        catch (e) {
            console.error(e.stack);
        }
    }
    else {
        if (this.usingLiveSumanServer) {
            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }
        else if (this.outputPath && _suman.viaSuman === true) {
            var json = JSON.stringify(result);
            fs.appendFileSync(this.outputPath, json += ',');
        }
    }
};
Suman.prototype.logResult = function (test) {
    if (_suman.sumanOpts.errors_only && test.dateComplete) {
        return;
    }
    if (_suman.usingRunner && !_suman.sumanOpts.useTAPOutput) {
        test.sumanModulePath = this._sumanModulePath;
        test.error = test.error ? (test.error._message || test.error.message || test.error.stack || test.error) : null;
        test.name = (test.desc || test.name);
        test.desc = (test.desc || test.name);
        var data = {
            test: test,
            type: 'LOG_RESULT',
            outputPath: this.outputPath
        };
        var str = JSON.stringify(data);
        str = str.replace(/(\r\n|\n|\r)/gm, '');
        process.send(JSON.parse(str));
    }
    else {
        if (this.usingLiveSumanServer) {
        }
        else if (this.outputPath) {
        }
        resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
        if (test.error || test.errorDisplay) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_FAIL), test);
        }
        else if (test.skipped) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
        }
        else if (test.stubbed) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
        }
        else {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_PASS), test);
        }
    }
};
function _makeSuman($module, _interface, shouldCreateResultsDir, config, cb) {
    var liveSumanServer = false;
    if (process.argv.indexOf('--live_suman_server') > -1) {
        liveSumanServer = true;
    }
    var timestamp;
    var outputPath = null;
    var networkLog = null;
    if (_suman.usingRunner) {
        timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
        if (!timestamp) {
            console.error(new Error(' => Suman implementation error => no timestamp provided by Suman test runner').stack);
            process.exit(constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
            return;
        }
    }
    else if (_suman.timestamp) {
        timestamp = _suman.timestamp;
    }
    else {
        timestamp = null;
    }
    su.makeResultsDir(shouldCreateResultsDir && !_suman.usingRunner, function (err) {
        if (err) {
            console.log(err.stack || err);
            return process.exit(constants.EXIT_CODES.ERROR_CREATING_RESULTS_DIR);
        }
        var server;
        try {
            server = findSumanServer(null);
        }
        catch (err) {
            console.log(err.stack || err);
        }
        if (timestamp) {
            try {
                outputPath = path.normalize(su.getHomeDir() + '/suman/test_results/'
                    + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');
            }
            catch (err) {
                console.log(err.stack || err);
            }
        }
        try {
            fs.unlinkSync(outputPath);
        }
        catch (err) {
        }
        cb(null, new Suman({
            fileName: path.resolve($module.filename),
            outputPath: outputPath,
            usingLiveSumanServer: liveSumanServer,
            networkLog: networkLog,
            server: server,
            interface: _interface
        }));
    });
}
exports.default = _makeSuman;
