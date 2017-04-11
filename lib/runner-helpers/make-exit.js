'use strict';

//npm
const events = require('suman-events');
const sumanUtils = require('suman-utils');
const async = require('async');
const sortBy = require('lodash.sortby');
const AsciiTable = require('ascii-table');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../../config/suman-constants');
const debug = require('suman-debug')('s:runner');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const finalizeOutput = require('../helpers/finalize-output');
const reporterRets = _suman.reporterRets = (_suman.reporterRets || []);

function mapCopy(copy) {
  return Object.keys(copy).map(key => {
    const val = copy[key];
    return val.value ? val.value : val.default;
  });
}

//////////////////////////////////////////////////////////

module.exports = function makeMakeExit(runnerObj, tableRows) {

  return function makeExit(messages, timeDiff) {

    debug('\n\n\n\tTable count:', runnerObj.tableCount);
    debug('\tDone count:', runnerObj.doneCount);

    resultBroadcaster.emit(String(events.RUNNER_ENDED), new Date().toISOString());

    let exitCode = 0;

    messages.every(function (msg) {  //use [].every hack to return more quickly

      const code = msg.code;
      const signal = msg.signal;

      if (!Number.isInteger(code)) {
        console.error(colors.red.bold(' => Suman implementation error => exit code is non-integer => '), code);
      }

      if (code > 0) {
        exitCode = 1;
        return false;
      }
      return true;

    });

    const allResultsTable = new AsciiTable('Suman Runner Results');
    const overallResultsTable = new AsciiTable('Overall Stats');

    //TODO: need to reconcile this with tests files that do not complete

    const keys = Object.keys(tableRows);

    const totals = {
      SUMAN_IGNORE: '',
      bailed: runnerObj.bailed ? 'YES' : 'no',
      suitesPassed: 0,
      suitesFailed: 0,
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

      const item = tableRows[key];
      const tableDataFromCP = item.tableData;
      const copy = JSON.parse(JSON.stringify(constantTableData));
      copy.SUITES_DESIGNATOR.value = item.defaultTableData.SUITES_DESIGNATOR;
      const actualExitCode = copy.TEST_SUITE_EXIT_CODE.value = item.actualExitCode;

      let obj;
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

        if (_suman.sumanOpts.sort_by_millis) {
          storeRowsHereIfUserWantsSortedData.push(copy);
        }

        allResultsTable.addRow.apply(allResultsTable, obj);
      }
      else {

        obj = mapCopy(copy);

        if (_suman.sumanOpts.sort_by_millis) {
          storeRowsHereIfUserWantsSortedData.push(copy);
        }

        totals.suitesFailed++; //TODO: possible that table data was not received, but exit code was still 0?
        allResultsTable.addRow.apply(allResultsTable, obj);
      }

    });

    let allResultsTableString = allResultsTable.toString();
    allResultsTableString = '\t' + allResultsTableString;
    resultBroadcaster.emit(String(events.RUNNER_RESULTS_TABLE), allResultsTableString);

    if (_suman.sumanOpts.sort_by_millis) {

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

    overallResultsTable.setHeading('Totals =>', 'Bailed?', 'Files Passed', 'Files Failed', 'Tests Passed',
      'Tests Failed', 'Tests Skipped', 'Tests Stubbed', 'All Tests', 'Total Time');
    overallResultsTable.addRow(Object.keys(totals).map(key => totals[key]));

    console.log('\n');
    let overallResultsTableString = overallResultsTable.toString();
    overallResultsTableString = '\t' + overallResultsTableString;
    resultBroadcaster.emit(String(events.RUNNER_OVERALL_RESULTS_TABLE), overallResultsTableString);

    //note: that we have intelligently patched process.exit to use a callback
    process.exit(exitCode, function (cb) {

      async.each(reporterRets, function (item, cb) {

        if (!item || item.count < 1) {
          // if nothing is returned from the reporter module, we can't do anything
          // and we assume it was all sync
          // likewise if count is less than 1 then we are ready to go
          process.nextTick(cb);
        }
        else {
          item.cb = function (err) {
            if (err) {
              console.error(err.stack || err);
            }
            process.nextTick(cb);
          }
        }
      }, cb);

    });

  };

};
