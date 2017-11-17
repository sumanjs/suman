'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var assert = require("assert");
var EE = require("events");
var flattenDeep = require('lodash.flattendeep');
var AsciiTable = require('ascii-table');
var async = require("async");
var fnArgs = require('function-arguments');
var suman_events_1 = require("suman-events");
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var general_1 = require("./helpers/general");
var suman_constants_1 = require("../config/suman-constants");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var sumanId = 0;
var Suman = (function () {
    function Suman(obj) {
        var projectRoot = _suman.projectRoot;
        var sumanConfig = this.config = obj.config;
        var sumanOpts = this.opts = obj.opts;
        this.fileName = obj.fileName;
        this.slicedFileName = obj.fileName.slice(projectRoot.length);
        this.timestamp = obj.timestamp;
        this.sumanId = ++sumanId;
        this.allDescribeBlocks = [];
        this.itOnlyIsTriggered = false;
        this.describeOnlyIsTriggered = false;
        this.deps = null;
        this.numHooksSkipped = 0;
        this.numHooksStubbed = 0;
        this.numBlocksSkipped = 0;
        this.force = obj.force || false;
        this.testBlockMethodCache = new Map();
        this.iocPromiseContainer = {};
        var q;
        this.getQueue = function () {
            if (!q) {
                var envTotal = void 0, envConfig = void 0;
                if (process.env.DEFAULT_PARALLEL_TOTAL_LIMIT && (envTotal = Number(process.env.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
                    assert(Number.isInteger(envTotal), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
                }
                if (sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT &&
                    (envConfig = Number(sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
                    assert(Number.isInteger(envConfig), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
                }
                var c = 1;
                if (!sumanOpts.series) {
                    c = envTotal || envConfig || suman_constants_1.constants.DEFAULT_PARALLEL_TOTAL_LIMIT;
                }
                assert(Number.isInteger(c) && c > 0 && c < 301, 'DEFAULT_PARALLEL_TOTAL_LIMIT must be an integer between 1 and 300 inclusive.');
                q = async.queue(function (task, cb) {
                    task(cb);
                }, c);
            }
            return q;
        };
    }
    Suman.prototype.getTableData = function () {
        throw new Error('Suman implementation error => not yet implemented.');
    };
    Suman.prototype.logFinished = function ($exitCode, skippedString, cb) {
        var combine = function (prev, curr) {
            return prev + curr;
        };
        var exitCode = $exitCode || 999;
        var desc = this.rootSuiteDescription;
        var suiteName = desc.length > 50 ? '...' + desc.substring(desc.length - 50, desc.length) : desc;
        var suiteNameShortened = desc.length > 15 ? desc.substring(0, 12) + '...' : desc;
        var delta = this.dateSuiteFinished - this.dateSuiteStarted;
        var deltaTotal = this.dateSuiteFinished - _suman.dateEverythingStarted;
        var skippedSuiteNames = [];
        var suitesTotal = null, suitesSkipped = null, testsSkipped = null, testsStubbed = null, testsPassed = null, testsFailed = null, totalTests = null;
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
            if (suitesSkipped > 0) {
                _suman.log.error('Suman implementation warning => suites skipped was non-zero ' +
                    'outside of suman.numBlocksSkipped value.');
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
                exitCode = suman_constants_1.constants.EXIT_CODES.TEST_CASE_FAIL;
            }
            else {
                exitCode = suman_constants_1.constants.EXIT_CODES.SUCCESSFUL_RUN;
            }
        }
        else {
            completionMessage = ' Test file errored out.';
        }
        var deltaStrg = String((typeof delta === 'number' && !Number.isNaN(delta)) ? delta : 'N/A');
        var deltaTotalStr = String((typeof deltaTotal === 'number' && !Number.isNaN(deltaTotal)) ? deltaTotal : 'N/A');
        var deltaSeconds = (typeof delta === 'number' && !Number.isNaN(delta)) ?
            Number(delta / 1000).toFixed(4) : 'N/A';
        var deltaTotalSeconds = (typeof deltaTotal === 'number' && !Number.isNaN(deltaTotal)) ?
            Number(deltaTotal / 1000).toFixed(4) : 'N/A';
        var passingRate = (typeof testsPassed === 'number' && typeof totalTests === 'number' && totalTests > 0) ?
            Number(100 * (testsPassed / totalTests)).toFixed(2) + '%' : 'N/A';
        if (_suman.usingRunner) {
            var d = {
                ROOT_SUITE_NAME: suiteNameShortened,
                SUITE_COUNT: suitesTotal,
                SUITE_SKIPPED_COUNT: suitesSkipped,
                TEST_CASES_TOTAL: totalTests,
                TEST_CASES_FAILED: testsFailed,
                TEST_CASES_PASSED: testsPassed,
                TEST_CASES_SKIPPED: testsSkipped,
                TEST_CASES_STUBBED: testsStubbed,
                TEST_SUMAN_MILLIS: deltaStrg,
                TEST_FILE_MILLIS: deltaTotalStr
            };
            process.nextTick(cb, null, {
                exitCode: exitCode,
                tableData: d
            });
        }
        else {
            var table = new AsciiTable('Results for: ' + suiteName);
            table.setHeading('Metric', '    Value   ', '    Comments   ');
            if (skippedString) {
                table.addRow('Status', completionMessage, skippedString);
            }
            else {
                table.addRow('Status', completionMessage, '            ');
                table.addRow('Num. of Unskipped Test Blocks', suitesTotal, '');
                table.addRow('Test blocks skipped', suitesSkipped ? 'At least ' + suitesSkipped : '-', skippedSuiteNames.length > 0 ? suman_utils_1.default.customStringify(skippedSuiteNames) : '');
                table.addRow('Hooks skipped', this.numHooksSkipped ?
                    'At least ' + this.numHooksSkipped : '-', suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Hooks stubbed', this.numHooksStubbed ?
                    'At least ' + this.numHooksStubbed : '-', suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('--------------------------', '         ---', suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Tests skipped', suitesSkipped ? 'At least ' + testsSkipped : (testsSkipped || '-'));
                table.addRow('Tests stubbed', testsStubbed || '-');
                table.addRow('Tests passed', testsPassed || '-');
                table.addRow('Tests failed', testsFailed || '-');
                table.addRow('Tests total', totalTests || '-');
                table.addRow('--------------------------', suman_utils_1.default.padWithXSpaces(10) + '---', suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Passing rate', passingRate);
                table.addRow('Actual time millis (delta)', deltaStrg, suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Actual time seconds (delta)', deltaSeconds, suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Total time millis (delta)', deltaTotalStr, suman_utils_1.default.padWithXSpaces(33) + '-');
                table.addRow('Total time seconds (delta)', deltaTotalSeconds, suman_utils_1.default.padWithXSpaces(33) + '-');
            }
            table.setAlign(0, AsciiTable.LEFT);
            table.setAlign(1, AsciiTable.RIGHT);
            table.setAlign(2, AsciiTable.RIGHT);
            process.nextTick(cb, null, {
                exitCode: exitCode,
                tableData: table
            });
        }
    };
    Suman.prototype.logResult = function (test) {
        var sumanOpts = this.opts;
        if (false && sumanOpts.errors_only && test.dateComplete) {
            return;
        }
        test.error = test.error ? (test.error._message || test.error.message || test.error.stack || test.error) : null;
        test.name = (test.desc || test.name);
        test.desc = (test.desc || test.name);
        test.filePath = test.filePath || this.fileName;
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
    };
    return Suman;
}());
exports.Suman = Suman;
exports.makeSuman = function ($module, opts, sumanOpts, sumanConfig) {
    var liveSumanServer = false;
    if (process.argv.indexOf('--live_suman_server') > -1) {
        liveSumanServer = true;
    }
    var timestamp;
    try {
        if (window) {
            timestamp = Number(_suman.timestamp);
        }
    }
    catch (err) { }
    if (_suman.usingRunner) {
        timestamp = _suman.timestamp = timestamp || Number(process.env.SUMAN_RUNNER_TIMESTAMP);
        if (!timestamp) {
            console.error(new Error('Suman implementation error => no timestamp provided by Suman test runner'));
            process.exit(suman_constants_1.constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
            return;
        }
    }
    else if (_suman.timestamp) {
        timestamp = Number(_suman.timestamp);
    }
    else {
        timestamp = null;
    }
    var server;
    try {
        server = general_1.findSumanServer(null);
    }
    catch (err) {
        _suman.log.error(err.stack || err);
    }
    return new Suman({
        fileName: path.resolve($module.filename),
        usingLiveSumanServer: liveSumanServer,
        server: server,
        opts: sumanOpts,
        force: opts.force,
        timestamp: timestamp,
        config: sumanConfig
    });
};
