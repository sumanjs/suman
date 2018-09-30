'use strict';

//dts
import {IGlobalSumanObj, ISumanConfig, ISumanOpts} from "suman-types/dts/global";
import {ITableData} from "suman-types/dts/table-data";
import {ITableDataCallbackObj, ISumanServerInfo} from "suman-types/dts/suman";
import {IInitOpts} from "suman-types/dts/index-init";

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
import chalk from 'chalk';
const AsciiTable = require('ascii-table');
import async = require('async');
const fnArgs = require('function-arguments');
import {events} from 'suman-events';
import * as su from 'suman-utils';
import McProxy = require('proxy-mcproxy');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {findSumanServer} from './helpers/general';
import {ITestDataObj} from "suman-types/dts/it";
import {constants} from './config/suman-constants';
import {TestBlock} from "./test-suite-helpers/test-suite";
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////////////////////////

export interface ITestBlockMethodCache {
  [key: string]: Object
}

///////////////////////////////////////////////////////////////////////////////

let sumanId = 0;

export interface ISumanInputs {
  fileName: string,
  timestamp: number,
  usingLiveSumanServer: boolean
  server: ISumanServerInfo,
  opts: ISumanOpts;
  config: ISumanConfig,
  force: boolean
}

export class Suman {

  ctx?: TestBlock;
  supply: Object;
  private __supply: Object;
  testBlockMethodCache: Map<Function, ITestBlockMethodCache>;
  iocData: Object;
  force: boolean;
  interface: string;
  fileName: string;
  opts: ISumanOpts;
  config: ISumanConfig;
  slicedFileName: string;
  containerProxy: any;
  timestamp: number;
  sumanId: number;
  allDescribeBlocks: Array<TestBlock>;
  describeOnlyIsTriggered: boolean;
  deps: Array<string>;
  usingLiveSumanServer: boolean;
  numHooksSkipped: number;
  numHooksStubbed: number;
  numBlocksSkipped: number;
  rootSuiteDescription: string;
  dateSuiteFinished: number;
  dateSuiteStarted: number;
  filename: string;
  itOnlyIsTriggered: boolean;
  extraArgs: Array<string>;
  sumanCompleted: boolean;
  desc: string;
  getQueue: Function;
  iocPromiseContainer: object;

  ////////////////////////////////////

  constructor(obj: Partial<ISumanOpts>) {

    const projectRoot = _suman.projectRoot;

    // via options
    const sumanConfig = this.config = obj.config;
    const sumanOpts = this.opts = obj.opts;
    this.fileName = obj.fileName;
    this.slicedFileName = obj.fileName.slice(projectRoot.length);
    this.timestamp = obj.timestamp;
    this.sumanId = ++sumanId;

    // initialize
    // let v = this.__inject = {};
    // this.$inject = McProxy.create(v);
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

    let q: any;

    this.getQueue = function () {

      if (!q) {

        let envTotal: number, envConfig: number;

        if (process.env.DEFAULT_PARALLEL_TOTAL_LIMIT && (envTotal = Number(process.env.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
          assert(Number.isInteger(envTotal), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
        }

        // note: we have to create the queue after loading this file, so that _suman.sumanConfig is defined.
        if (sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT &&
          (envConfig = Number(sumanConfig.DEFAULT_PARALLEL_TOTAL_LIMIT))) {
          assert(Number.isInteger(envConfig), 'process.env.DEFAULT_PARALLEL_TOTAL_LIMIT cannot be cast to an integer.');
        }

        let c = 1;  // concurrency

        if (!sumanOpts.series) {
          c = envTotal || envConfig || constants.DEFAULT_PARALLEL_TOTAL_LIMIT;
        }

        assert(Number.isInteger(c) && c > 0 && c < 301,
          'DEFAULT_PARALLEL_TOTAL_LIMIT must be an integer between 1 and 300 inclusive.');

        q = async.queue<any,any>((task,cb) => task(cb), c);
      }

      return q;

    };

  }

  getTableData() {
    throw new Error('Suman implementation error => not yet implemented.')
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
      suitesSkipped = this.allDescribeBlocks.filter(block => {
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

      testsSkipped = this.allDescribeBlocks.map(function (block: TestBlock) {
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

      testsStubbed = this.allDescribeBlocks.map(function (block: TestBlock) {

        return block.getParallelTests().concat(block.getTests())
        .filter(function (test) {
          return test.stubbed;
        }).length;

      }).reduce(combine);

      testsPassed = this.allDescribeBlocks.map(function (block: TestBlock) {
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

      testsFailed = this.allDescribeBlocks.map(function (block: TestBlock) {
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

      totalTests = this.allDescribeBlocks.map(function (block: TestBlock) {
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
        TEST_FILE_MILLIS: deltaTotalStr
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

    const sumanOpts = this.opts;

    if (false && sumanOpts.errors_only && test.dateComplete) {
      // since errors only and this test has completed, we ignore and don't write out result
      return;
    }

    test.error = test.error ? (test.error._message || test.error.message || test.error.stack || test.error) : null;
    test.name = (test.desc || test.name);
    test.desc = (test.desc || test.name);
    test.filePath = test.filePath || this.fileName;

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

// alias
export type ISuman = Suman;

///////////////////////////////////////////////////////////////////////////////////////////////

export const makeSuman =  ($module: NodeModule, opts: IInitOpts, sumanOpts: Partial<ISumanOpts>, sumanConfig: Partial<ISumanConfig>): Suman => {

  let liveSumanServer = false;

  if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
    liveSumanServer = true;
  }

  /*
   note: when debugging with node-inspector process.send is defined
   */

  let timestamp: number;

  try{
    if(window){
      timestamp = Number(_suman.timestamp);
    }
  }
  catch(err){}

  if (_suman.usingRunner) {  //using runner, obviously, so runner provides timestamp value
    timestamp = _suman.timestamp = timestamp || Number(process.env.SUMAN_RUNNER_TIMESTAMP);
    if (!timestamp) {
      console.error(new Error('Suman implementation error => no timestamp provided by Suman test runner'));
      process.exit(constants.EXIT_CODES.NO_TIMESTAMP_AVAILABLE_IN_TEST);
      return;
    }
  }
  else if (_suman.timestamp) {  //using suman executable, but not runner
    timestamp = Number(_suman.timestamp);
  }
  else {
    //test file executed with plain node executable
    timestamp = null;
  }


  return new Suman({
    server: null,
    fileName: path.resolve($module.filename),
    usingLiveSumanServer: liveSumanServer,
    opts: sumanOpts,
    force: opts.force,
    timestamp,
    config: sumanConfig
  });

};


