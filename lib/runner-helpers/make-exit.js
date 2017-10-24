'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var EE = require("events");
var events = require('suman-events').events;
var sumanUtils = require('suman-utils');
var async = require("async");
var player = require('play-sound')();
var sortBy = require('lodash.sortby');
var AsciiTable = require('ascii-table');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
var create_gantt_chart_1 = require("./create-gantt-chart");
var timeOutMillis = 15000;
var mapCopy = function (copy) {
    return Object.keys(copy).map(function (key) {
        var val = copy[key];
        return val.value ? val.value : val.default;
    });
};
exports.makeExit = function (runnerObj, tableRows) {
    return function (messages, timeDiff) {
        var sumanOpts = _suman.sumanOpts;
        resultBroadcaster.emit(String(events.RUNNER_ENDED), new Date().toISOString());
        var exitCode = 0;
        messages.every(function (msg) {
            var code = msg.code;
            var signal = msg.signal;
            if (!Number.isInteger(code)) {
                _suman.log.error(chalk.red.bold('Suman implementation warning => exit code is non-integer => '), code);
            }
            if (code > 0) {
                exitCode = 1;
                return false;
            }
            return true;
        });
        var allResultsTable = new AsciiTable('Suman Runner Results');
        var overallResultsTable = new AsciiTable('Overall/Total Stats');
        var keys = Object.keys(tableRows);
        var filesTotal = 0;
        var filesPassed = 0;
        var filesFailed = 0;
        var totals = {
            bailed: runnerObj.bailed ? 'YES' : 'no',
            SUMAN_IGNORE1: '',
            filesInfo: 'this is an error, please report on github.',
            SUMAN_IGNORE2: '',
            testsPassed: 0,
            testsFailed: 0,
            testsSkipped: 0,
            testsStubbed: 0,
            allTests: 0,
            totalTime: timeDiff.runner + '/' + timeDiff.total
        };
        var constantTableData = constants.tableData;
        allResultsTable.setHeading.apply(allResultsTable, Object.keys(constantTableData).map(function (key) { return constantTableData[key].name; }));
        var storeRowsHereIfUserWantsSortedData = [];
        keys.forEach(function (key) {
            filesTotal++;
            var item = tableRows[key];
            var tableDataFromCP = item.tableData;
            var copy = JSON.parse(JSON.stringify(constantTableData));
            copy.SUITES_DESIGNATOR.value = item.defaultTableData.SUITES_DESIGNATOR;
            var actualExitCode = copy.TEST_SUITE_EXIT_CODE.value = item.actualExitCode;
            if (actualExitCode === 0) {
                filesPassed++;
            }
            else {
                filesFailed++;
            }
            var obj;
            if (tableDataFromCP) {
                Object.keys(tableDataFromCP).forEach(function (key) {
                    var val = tableDataFromCP[key];
                    if (copy[key] && !copy[key].value) {
                        copy[key].value = val;
                    }
                });
                totals.testsPassed += tableDataFromCP.TEST_CASES_PASSED;
                totals.testsFailed += tableDataFromCP.TEST_CASES_FAILED;
                totals.testsSkipped += tableDataFromCP.TEST_CASES_SKIPPED;
                totals.testsStubbed += tableDataFromCP.TEST_CASES_STUBBED;
                totals.allTests += tableDataFromCP.TEST_CASES_TOTAL;
                obj = mapCopy(copy);
                if (sumanOpts.sort_by_millis) {
                    storeRowsHereIfUserWantsSortedData.push(copy);
                }
                allResultsTable.addRow.apply(allResultsTable, obj);
            }
            else {
                obj = mapCopy(copy);
                if (sumanOpts.sort_by_millis) {
                    storeRowsHereIfUserWantsSortedData.push(copy);
                }
                allResultsTable.addRow.apply(allResultsTable, obj);
            }
        });
        var allResultsTableString = allResultsTable.toString();
        allResultsTableString = '\t' + allResultsTableString;
        resultBroadcaster.emit(String(events.RUNNER_RESULTS_TABLE), allResultsTableString);
        if (sumanOpts.sort_by_millis) {
            var tableSortedByMillis_1 = new AsciiTable('Suman Runner Results - sorted by millis');
            tableSortedByMillis_1.setHeading.apply(tableSortedByMillis_1, Object.keys(constantTableData).map(function (key) { return constantTableData[key].name; }));
            sortBy(storeRowsHereIfUserWantsSortedData, function (item) {
                return item.TEST_FILE_MILLIS.value;
            }).map(function (item) {
                return mapCopy(item);
            }).forEach(function (obj) {
                tableSortedByMillis_1.addRow.apply(tableSortedByMillis_1, obj);
            });
            var strSorted = tableSortedByMillis_1.toString();
            strSorted = '\t' + strSorted;
            resultBroadcaster.emit(String(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS), strSorted);
        }
        totals.filesInfo = [filesPassed, filesFailed, filesTotal].join(' / ');
        overallResultsTable.setHeading('Bailed?', 'Files ➣', '(Passed/Failed/Total)', 'totals:', 'Passed', 'Failed', 'Skipped', 'Stubbed', 'All Tests', 'Total Time');
        overallResultsTable.addRow(Object.keys(totals).map(function (key) { return totals[key]; }));
        console.log('\n');
        var overallResultsTableString = overallResultsTable.toString();
        overallResultsTableString = '\t' + overallResultsTableString;
        resultBroadcaster.emit(String(events.RUNNER_OVERALL_RESULTS_TABLE), overallResultsTableString);
        var timedOut = false;
        var to = setTimeout(function () {
            timedOut = true;
            _suman.log.error("runner exit routine timed out after " + timeOutMillis + "ms.");
            process.exit(1);
        }, timeOutMillis);
        async.autoInject({
            makeErrorOrSuccessSound: function (cb) {
                if (process.env.SUMAN_WATCH_TEST_RUN === 'yes') {
                    var soundFilePath = void 0;
                    if (exitCode === 0) {
                        soundFilePath = null;
                    }
                    else {
                        soundFilePath = path.resolve(process.env.HOME + '/fail-trombone-02.mp3');
                    }
                    if (!soundFilePath) {
                        return process.nextTick(cb);
                    }
                    player.play(soundFilePath, { timeout: 5000 }, function (err) {
                        err && _suman.log.error(err);
                        cb(null);
                    });
                }
                else {
                    process.nextTick(cb);
                }
            },
            handleAsyncReporters: general_1.makeHandleAsyncReporters(reporterRets),
            makeGanttChart: function (cb) {
                create_gantt_chart_1.createGanttChart(cb);
            }
        }, function (err) {
            err && _suman.log.error(err.stack || err);
            if (timedOut) {
                return;
            }
            clearTimeout(to);
            process.exit(exitCode);
        });
    };
};
