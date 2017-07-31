'use strict';
import {IGlobalSumanObj} from "../../dts/global";
import {ISumanCPMessages} from "./handle-multiple-processes";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
const {events} = require('suman-events');
const sumanUtils = require('suman-utils');
import async = require('async');

const sortBy = require('lodash.sortby');
const AsciiTable = require('ascii-table');
import chalk  = require('chalk');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
import {createGanttChart} from './create-gantt-chart';
let timeOutMillis = 15000;

/////////////////////////////////////////////////////////

const mapCopy = function (copy: Object) {
  return Object.keys(copy).map(key => {
    const val = copy[key];
    return val.value ? val.value : val.default;
  });
};

//////////////////////////////////////////////////////////

export const makeExit = function (runnerObj, tableRows) {

  return function (messages: Array<ISumanCPMessages>, timeDiff: number) {

    const sumanOpts = _suman.sumanOpts;

    resultBroadcaster.emit(String(events.RUNNER_ENDED), new Date().toISOString());

    let exitCode = 0;

    messages.every(function (msg) {  //use [].every hack to return more quickly

      const code = msg.code;
      const signal = msg.signal;

      if (!Number.isInteger(code)) {
        _suman.logError(chalk.red.bold('Suman implementation error => exit code is non-integer => '), code);
      }

      if (code > 0) {
        exitCode = 1;
        return false;
      }
      return true;

    });

    const allResultsTable = new AsciiTable('Suman Runner Results');
    const overallResultsTable = new AsciiTable('Overall/Total Stats');
    const keys = Object.keys(tableRows);

    let filesTotal = 0;
    let filesPassed = 0;
    let filesFailed = 0;

    const totals = {
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

    const constantTableData = constants.tableData;
    allResultsTable.setHeading.apply(allResultsTable, Object.keys(constantTableData).map(key => constantTableData[key].name));
    const storeRowsHereIfUserWantsSortedData = [];

    keys.forEach(function (key) {

      filesTotal++;

      const item = tableRows[key];
      const tableDataFromCP = item.tableData;
      const copy = JSON.parse(JSON.stringify(constantTableData));
      copy.SUITES_DESIGNATOR.value = item.defaultTableData.SUITES_DESIGNATOR;
      const actualExitCode = copy.TEST_SUITE_EXIT_CODE.value = item.actualExitCode;

      if (actualExitCode === 0) {
        filesPassed++;
      }
      else {
        filesFailed++;
      }

      let obj;
      if (tableDataFromCP) {

        Object.keys(tableDataFromCP).forEach(function (key) {
          const val = tableDataFromCP[key];
          if (copy[key] && !copy[key].value) {  //if value is not already set
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

    let allResultsTableString = allResultsTable.toString();
    allResultsTableString = '\t' + allResultsTableString;
    resultBroadcaster.emit(String(events.RUNNER_RESULTS_TABLE), allResultsTableString);

    if (sumanOpts.sort_by_millis) {

      const tableSortedByMillis = new AsciiTable('Suman Runner Results - sorted by millis');

      tableSortedByMillis.setHeading.apply(tableSortedByMillis, Object.keys(constantTableData).map(key => constantTableData[key].name));

      sortBy(storeRowsHereIfUserWantsSortedData, function (item) {
        return item.TEST_FILE_MILLIS.value;
      }).map(function (item) {
        return mapCopy(item);
      }).forEach(function (obj) {
        tableSortedByMillis.addRow.apply(tableSortedByMillis, obj);
      });

      let strSorted = tableSortedByMillis.toString();
      strSorted = '\t' + strSorted;
      resultBroadcaster.emit(String(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS), strSorted);

    }

    totals.filesInfo = [filesPassed, filesFailed, filesTotal].join(' / ');

    overallResultsTable.setHeading('Bailed?', 'Files ➣', '(Passed/Failed/Total)', 'Test cases ➣', 'Passed',
      'Failed', 'Skipped', 'Stubbed', 'All Tests', 'Total Time');
    overallResultsTable.addRow(Object.keys(totals).map(key => totals[key]));

    console.log('\n');
    let overallResultsTableString = overallResultsTable.toString();
    overallResultsTableString = '\t' + overallResultsTableString;
    resultBroadcaster.emit(String(events.RUNNER_OVERALL_RESULTS_TABLE), overallResultsTableString);

    //note: that we have intelligently patched process.exit to use a callback

    let timedOut = false;
    const to = setTimeout(function () {
      timedOut = true;
      _suman.logError(`runner exit routine timed out after ${timeOutMillis}ms.`);
      process.exit(1);
    }, timeOutMillis);

    async.autoInject({

      handleAsyncReporters: function (cb: Function) {
        async.each(reporterRets, function (item: Object, cb: Function) {

          if (!item || item.count < 1) {
            // if nothing is returned from the reporter module, we can't do anything
            // and we assume it was all sync
            // likewise if count is less than 1 then we are ready to go
            process.nextTick(cb);
          }
          else {
            item.cb = function (err: Error) {
              err && _suman.logError(err.stack || err);
              process.nextTick(cb);
            }
          }
        }, cb);
      },

      makeGanttChart: function (cb: Function) {
        createGanttChart(cb);
      }

    }, function (err: Error) {
      err && _suman.logError(err.stack || err);
      if (timedOut) {
        return;
      }
      clearTimeout(to);
      process.exit(exitCode);
    });

  };

};
