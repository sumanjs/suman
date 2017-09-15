'use strict';
import {ITestSuite} from "../dts/test-suite";
import {IGlobalSumanObj, IPseudoError, ISumanConfig} from "../dts/global";
import {ITableData} from "../dts/table-data";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');

//npm
const flattenDeep = require('lodash.flattendeep');
const readline = require('readline');
import * as chalk from 'chalk';

const AsciiTable = require('ascii-table');
import async = require('async');

const fnArgs = require('function-arguments');
import {events} from 'suman-events';
import su from 'suman-utils';
const McProxy = require('proxy-mcproxy');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {findSumanServer, ISumanServerInfo} from './helpers/find-suman-server';
import {ITestDataObj} from "../dts/it";
import {constants} from '../config/suman-constants';
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
import {getClient} from './index-helpers/socketio-child-client';

//////////////////////////////////////////////////////////////////////////////

export interface ITableDataCallbackObj {
  exitCode: number,
  tableData: Object
}

///////////////////////////////////////////////////////////////////////////////

let sumanId = 0;

interface ISumanInputs {
  interface: string,
  fileName: string,
  timestamp: number,
  usingLiveSumanServer: boolean
  server: ISumanServerInfo
}

class Suman {

  interface: string;
  fileName: string;
  slicedFileName: string;
  timestamp: number;
  sumanId: number;
  allDescribeBlocks: Array<ITestSuite>;
  describeOnlyIsTriggered: boolean;
  deps: Array<string>;
  usingLiveSumanServer: boolean;
  numHooksSkipped: number;
  numHooksStubbed: number;
  numBlocksSkipped: number;
  rootSuiteDescription: string;
  dateSuiteFinished: number;
  dateSuiteStarted: number;
  $inject: Object;

  ////////////////////////////////////

  constructor(obj: ISumanInputs) {

    const projectRoot = _suman.projectRoot;

    // via options
    this.interface = obj.interface;
    this.fileName = obj.fileName;
    this.slicedFileName = obj.fileName.slice(projectRoot.length);
    this.timestamp = obj.timestamp;
    this.sumanId = ++sumanId;

    // initialize
    this.$inject = McProxy.create();
    this.allDescribeBlocks = [];
    this.describeOnlyIsTriggered = false;
    this.deps = null;
    this.numHooksSkipped = 0;
    this.numHooksStubbed = 0;
    this.numBlocksSkipped = 0;
  }

  getTableData() {
    throw new Error('Suman => not yet implemente')
  }

  logFinished($exitCode: number, skippedString: string, cb: Function) {

    let combine = function (prev: number, curr: number) {
      return prev + curr;
    };

    let exitCode = $exitCode || 999; //in case of future fall through

    const desc = this.rootSuiteDescription;
    const suiteName = desc.length > 50 ? '...' + desc.substring(desc.length - 50, desc.length) : desc;
    const suiteNameShortened = desc.length > 15 ? desc.substring(0, 12) + '...' : desc;
    let delta: number = this.dateSuiteFinished - this.dateSuiteStarted;
    let deltaTotal: number = this.dateSuiteFinished - _suman.dateEverythingStarted;

    const skippedSuiteNames: Array<string> = [];

    let suitesTotal = null, suitesSkipped = null, testsSkipped = null, testsStubbed = null,
      testsPassed = null, testsFailed = null, totalTests = null;

    let completionMessage = ' (implementation error, please report) ';

    if ($exitCode === 0 && skippedString) {
      completionMessage = '(Test suite was skipped)';
      exitCode = 0;
    }
    else if ($exitCode === 0 && !skippedString) {

      completionMessage = 'Ran to completion';
      suitesTotal = this.allDescribeBlocks.length;
      suitesSkipped = this.allDescribeBlocks.filter(function (block: ITestSuite) {
        if (block.skipped || block.skippedDueToOnly) {
          skippedSuiteNames.push(block.desc);
          return true;
        }
      }).length;

      if (suitesSkipped > 0) {
        _suman.logError('Suman implementation warning => suites skipped was non-zero ' +
          'outside of suman.numBlocksSkipped value.');
      }

      suitesSkipped += this.numBlocksSkipped;

      testsSkipped = this.allDescribeBlocks.map(function (block: ITestSuite) {
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

      testsStubbed = this.allDescribeBlocks.map(function (block: ITestSuite) {

        return block.getParallelTests().concat(block.getTests())
        .filter(function (test) {
          return test.stubbed;
        }).length;

      }).reduce(combine);

      testsPassed = this.allDescribeBlocks.map(function (block: ITestSuite) {
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

      testsFailed = this.allDescribeBlocks.map(function (block: ITestSuite) {
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

      totalTests = this.allDescribeBlocks.map(function (block: ITestSuite) {
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

    const deltaStrg: string = String((typeof delta === 'number' && !Number.isNaN(delta)) ? delta : 'N/A');

    const deltaTotalStr: string = String((typeof deltaTotal === 'number' && !Number.isNaN(deltaTotal)) ? deltaTotal : 'N/A');

    const deltaSeconds = (typeof delta === 'number' && !Number.isNaN(delta)) ?
      Number(delta / 1000).toFixed(4) : 'N/A';

    const deltaTotalSeconds = (typeof deltaTotal === 'number' && !Number.isNaN(deltaTotal)) ?
      Number(deltaTotal / 1000).toFixed(4) : 'N/A';

    const passingRate = (typeof testsPassed === 'number' && typeof totalTests === 'number' && totalTests > 0) ?
      Number(100 * (testsPassed / totalTests)).toFixed(2) + '%' : 'N/A';

    if (_suman.usingRunner) {

      const d: ITableData = {
        ROOT_SUITE_NAME: suiteNameShortened,
        SUITE_COUNT: suitesTotal,
        SUITE_SKIPPED_COUNT: suitesSkipped,
        TEST_CASES_TOTAL: totalTests,
        TEST_CASES_FAILED: testsFailed,
        TEST_CASES_PASSED: testsPassed,
        TEST_CASES_SKIPPED: testsSkipped,
        TEST_CASES_STUBBED: testsStubbed,
        TEST_SUMAN_MILLIS: deltaStrg,
        TEST_FILE_MILLIS: deltaTotalStr,
        OVERALL_DESIGNATOR: 'received'
      };

      process.nextTick(cb, null, {
        exitCode: exitCode,
        tableData: d
      });

    }
    else {

      const table = new AsciiTable('Results for: ' + suiteName);
      table.setHeading('Metric', '    Value   ', '    Comments   ');

      if (skippedString) {
        table.addRow('Status', completionMessage, skippedString);
      }
      else {
        table.addRow('Status', completionMessage, '            ');
        table.addRow('Num. of Unskipped Test Blocks', suitesTotal, '');

        table.addRow('Test blocks skipped', suitesSkipped ? 'At least ' + suitesSkipped : '-',
          skippedSuiteNames.length > 0 ? su.customStringify(skippedSuiteNames) : '');

        table.addRow('Hooks skipped', this.numHooksSkipped ?
          'At least ' + this.numHooksSkipped : '-', su.padWithXSpaces(33) + '-');

        table.addRow('Hooks stubbed', this.numHooksStubbed ?
          'At least ' + this.numHooksStubbed : '-', su.padWithXSpaces(33) + '-');
        table.addRow('--------------------------', '         ---', su.padWithXSpaces(33) + '-');
        table.addRow('Tests skipped', suitesSkipped ? 'At least ' + testsSkipped : (testsSkipped || '-'));
        table.addRow('Tests stubbed', testsStubbed || '-');
        table.addRow('Tests passed', testsPassed || '-');
        table.addRow('Tests failed', testsFailed || '-');
        table.addRow('Tests total', totalTests || '-');
        table.addRow('--------------------------', su.padWithXSpaces(10) + '---', su.padWithXSpaces(33) + '-');
        table.addRow('Passing rate', passingRate);
        table.addRow('Actual time millis (delta)', deltaStrg, su.padWithXSpaces(33) + '-');
        table.addRow('Actual time seconds (delta)', deltaSeconds, su.padWithXSpaces(33) + '-');
        table.addRow('Total time millis (delta)', deltaTotalStr, su.padWithXSpaces(33) + '-');
        table.addRow('Total time seconds (delta)', deltaTotalSeconds, su.padWithXSpaces(33) + '-');
      }

      //TODO: if root suite is skipped, it is noteworthy

      table.setAlign(0, AsciiTable.LEFT);
      table.setAlign(1, AsciiTable.RIGHT);
      table.setAlign(2, AsciiTable.RIGHT);

      process.nextTick(cb, null, {
        exitCode: exitCode,
        tableData: table
      });
    }

  }

  logResult(test: ITestDataObj): void {

    if (false && _suman.sumanOpts.errors_only && test.dateComplete) {
      // since errors only and this test has completed, we ignore and don't write out result
      return;
    }

    test.error = test.error ? (test.error._message || test.error.message || test.error.stack || test.error) : null;
    test.name = (test.desc || test.name);
    test.desc = (test.desc || test.name);
    test.filePath = test.filePath || this.fileName;

    let str = su.customStringify({
      childId: process.env.SUMAN_CHILD_ID,
      test,
      type: 'LOG_RESULT',
    });

    // str = str.replace(/(\r\n|\n|\r)/gm, ''); ///This javascript code removes all 3 types of line breaks
    // process.send(JSON.parse(str));

    const client = getClient();
    const LOG_RESULT = constants.runner_message_type.LOG_RESULT;

    if (global.usingBrowserEtcEtc) {
      // TODO: note for the web browser, we need to use this
      client.emit(LOG_RESULT, JSON.parse(str));
    }

    // broadcast results
    resultBroadcaster.emit(String(events.TEST_CASE_END), test);

    if (test.error || test.errorDisplay) {
      resultBroadcaster.emit(String(events.TEST_CASE_FAIL), test);
    }
    else if (test.skipped) {
      resultBroadcaster.emit(String(events.TEST_CASE_SKIPPED), test);
    }
    else if (test.stubbed) {
      resultBroadcaster.emit(String(events.TEST_CASE_STUBBED), test);
    }
    else {
      resultBroadcaster.emit(String(events.TEST_CASE_PASS), test);
    }

  }
}

///////////////////////////////////////////////////////////////////////////////////////////////

export const makeSuman = function ($module: NodeModule, _interface: string,
                                   shouldCreateResultsDir: boolean, config: ISumanConfig, cb: Function) {

  let liveSumanServer = false;

  if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
    liveSumanServer = true;
  }

  /*
   note: when debugging with node-inspector process.send is defined
   */

  let timestamp: number;

  if (_suman.usingRunner) {  //using runner, obviously, so runner provides timestamp value
    timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP;
    if (!timestamp) {
      console.error(new Error(' => Suman implementation error => no timestamp provided by Suman test runner').stack);
      process.exit(constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
      return;
    }
  }
  else if (_suman.timestamp) {  //using suman executable, but not runner
    timestamp = _suman.timestamp;
  }
  else {
    //test file executed with plain node executable
    timestamp = null;
  }

  let server: ISumanServerInfo;

  try {
    server = findSumanServer(null);
  }
  catch (err) {
    _suman.logError(err.stack || err);
  }

  setImmediate(function () {

    cb(null, new Suman({
      fileName: path.resolve($module.filename),
      usingLiveSumanServer: liveSumanServer,
      server,
      timestamp,
      interface: _interface
    }));

  });

};


