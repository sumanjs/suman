'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const fs = require('fs');
const path = require('path');
const domain = require('domain');
const EE = require('events');
const util = require('util');

//npm
const flattenDeep = require('lodash.flattendeep');
const readline = require('readline');
const colors = require('colors/safe');
const AsciiTable = require('ascii-table');
const async = require('async');
const fnArgs = require('function-arguments');
const events = require('suman-events');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');
const finalizeOutput = require('./helpers/finalize-output');
const findSumanServer = require('./find-suman-server');
const constants = require('../config/suman-constants');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

///////////////////////// debugging ///////////////////////////////////////////

const weAreDebugging = require('./helpers/we-are-debugging');

///////////////////////////////////////////////////////////////////////////////

let sumanId = 0;

function Suman (obj) {

  debugger;
  const projectRoot = _suman.projectRoot;

  // via options
  this.interface = obj.interface;
  this.fileName = obj.fileName;
  this.slicedFileName = obj.fileName.slice(projectRoot.length);
  this.networkLog = obj.networkLog;
  this.outputPath = obj.outputPath;
  this.timestamp = obj.timestamp;
  this.sumanId = ++sumanId;

  // initialize
  this.allDescribeBlocks = [];
  this.describeOnlyIsTriggered = false;
  this.deps = null;
  this.numHooksSkipped = 0;
  this.numHooksStubbed = 0;
  this.numBlocksSkipped = 0;

}


Suman.prototype.log = function (userInput, test) {

  let self = this;

  let data = {
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

    let json;
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
      //    let pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results')
      //    json = JSON.stringify(data);
      //    fs.appendFileSync(pth, json += ',');
      //}
      //catch (err) {
      //    console.error('Suman cannot log your test result data:\n' + err.stack);
      //}
    }
  }
};

Suman.prototype.logFatalSuite = function logFatalSuite (test) {

  const data = {
    'FATAL': {
      testId: test.testId
    }

  };

  if (_suman.usingRunner) {
    //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted? or can we avoid this if only this process writes to the file?
    //process.send(data);
  }
  else {

    if (this.usingLiveSumanServer) {
      //TODO: we may want to log locally first just to make sure we have the data somewhere
      this.networkLog.sendTestData(data);
    }
    else if (this.outputPath) {
      let json = JSON.stringify(data.test);
      fs.writeFileSync(this.outputPath, '');
    }
    else {
      console.log(new Error('Suman cannot log your test result data:\n').stack);
      //try {
      //    let pth = path.resolve(sumanUtils.getHomeDir() + '/suman_results');
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

function combine(prev, curr){
    return prev + curr;
}

Suman.prototype.logFinished = function ($exitCode, skippedString, cb) {

  //note: if $exitCode is defined, it should be > 0

  let exitCode = $exitCode || 999; //in case of future fall through

  // const desc = this.allDescribeBlocks[ 0 ] ? this.allDescribeBlocks[ 0 ].desc : '[unknown suite description]';
  const desc = this.rootSuiteDescription;
  const suiteName = desc.length > 50 ? '...' + desc.substring(desc.length - 50, desc.length) : desc;
  const suiteNameShortened = desc.length > 15 ? desc.substring(0, 12) + '...' : desc;
  let delta = this.dateSuiteFinished - this.dateSuiteStarted;

  const skippedSuiteNames = [];
  let suitesTotal = null;
  let suitesSkipped = null;
  let testsSkipped = null;
  let testsStubbed = null;
  let testsPassed = null;
  let testsFailed = null;
  let totalTests = null;

  let completionMessage = ' (implementation error, please report) ';

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
  const deltaMinutes = (typeof delta === 'number' && !Number.isNaN(delta)) ? Number(delta / (1000 * 60)).toFixed(4) : 'N/A';
  const passingRate = (typeof testsPassed === 'number' && typeof totalTests === 'number' && totalTests > 0) ?
    Number(100 * (testsPassed / totalTests)).toFixed(2) + '%' : 'N/A';

  if (_suman.usingRunner) {

    const d = {};
    // d.ROOT_SUITE_NAME = suiteNameShortened;
    d.SUITE_COUNT = suitesTotal;
    d.SUITE_SKIPPED_COUNT = suitesSkipped;
    d.TEST_CASES_TOTAL = totalTests;
    d.TEST_CASES_FAILED = testsFailed;
    d.TEST_CASES_PASSED = testsPassed;
    d.TEST_CASES_SKIPPED = testsSkipped;
    d.TEST_CASES_STUBBED = testsStubbed;
    d.TEST_FILE_MILLIS = delta;
    d.OVERALL_DESIGNATOR = 'received';

    process.nextTick(function () {
      cb(null, {
        exitCode: exitCode,
        tableData: d
      })
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
        skippedSuiteNames.length > 0 ? JSON.stringify(skippedSuiteNames) : '');

      table.addRow('Hooks skipped', this.numHooksSkipped ?
        'At least ' + this.numHooksSkipped : '-', '                                 -');

      table.addRow('Hooks stubbed', this.numHooksStubbed ?
        'At least ' + this.numHooksStubbed : '-', '                                 -');
      table.addRow('--------------------------', '         ---', '                                 -');
      table.addRow('Tests skipped', suitesSkipped ? 'At least ' + testsSkipped : (testsSkipped || '-'));
      table.addRow('Tests stubbed', testsStubbed || '-');
      table.addRow('Tests passed', testsPassed || '-');
      table.addRow('Tests failed', testsFailed || '-');
      table.addRow('Tests total', totalTests || '-');
      table.addRow('--------------------------', '          ---', '                                 -');
      table.addRow('Passing rate', passingRate);
      table.addRow('Total time millis (delta)', delta, '                                   -');
      table.addRow('Total time minutes (delta)', deltaMinutes, '                                   -');
    }

    //TODO: if root suite is skipped, it is noteworthy

    table.setAlign(0, AsciiTable.LEFT);
    table.setAlign(1, AsciiTable.RIGHT);
    table.setAlign(2, AsciiTable.RIGHT);

    process.nextTick(function () {
      cb(null, {
        exitCode: exitCode,
        tableData: table
      });
    });

  }

};

Suman.prototype.logData = function logData (suite) {

  /// this should be used to store data in SQLite

  suite.error = suite.error || null;

  const result = {
    testId: suite.testId,
    desc: suite.desc,
    opts: suite.opts,
    children: suite.getChildren(),
    tests: flattenDeep([suite.getTests(), suite.getParallelTests()])
  };

  if (_suman.usingRunner) {

    let data = {
      test: result,
      type: 'LOG_DATA',
      outputPath: this.outputPath
    };

    //TODO: need to send log_data to runner so that writing to same file doesn't get corrupted?
    //TODO: or can we avoid this if only this process writes to the file?
    //TODO: note, only one process writes to this file since it is a 1:1 process per file
    // process.send(data);
    try {
      let json = JSON.stringify(data.test);
      fs.appendFileSync(this.outputPath, json += ',');
    }
    catch (e) {
      //TODO: this needs to log
      console.error(e.stack);
      // console.log('test data:', util.inspect(data.test));
    }

  }
  else {

    if (this.usingLiveSumanServer) {
      //TODO: we may want to log locally first just to make sure we have the data somewhere
      // this.networkLog.sendTestData(data);
      let json = JSON.stringify(result);
      fs.appendFileSync(this.outputPath, json += ',');
    }
    else if (this.outputPath && _suman.viaSuman === true) {

      let json = JSON.stringify(result);
      fs.appendFileSync(this.outputPath, json += ',');
    }

  }
};

Suman.prototype.logResult = function (test) {  //TODO: refactor to logTestResult

  //TODO: this function becomes just a way to log to command line, not to text DB

  const config = _suman.sumanConfig;

  if (_suman.sumanOpts.errors_only && test.dateComplete) {
    // since errors only and this test has completed, we ignore and don't write out result
    return;
  }

  if (_suman.usingRunner && !_suman.sumanOpts.useTAPOutput) {

    const _test = {
      cb: test.cb,
      sumanModulePath: this._sumanModulePath,
      error: test.error ? (test.error._message || test.error.stack || test.error) : null,
      errorDisplay: test.errorDisplay,
      mode: test.mode,
      plan: test.planCountExpected,
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

    let data = {
      test: _test,
      type: 'LOG_RESULT',
      outputPath: this.outputPath
    };

    let str = JSON.stringify(data);
    str = str.replace(/(\r\n|\n|\r)/gm, ''); ///This javascript code removes all 3 types of line breaks
    process.send(JSON.parse(str));

  }
  else {

    if (this.usingLiveSumanServer) {
      // this.networkLog.sendTestData(data);
    }
    else if (this.outputPath) {
      // let json = JSON.stringify(test);
      // fs.appendFileSync(this.outputPath, json += ',');
    }

    resultBroadcaster.emit(String(events.TEST_CASE_END), test);

    if (test.errorDisplay) {
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
};

function makeSuman ($module, _interface, shouldCreateResultsDir, config, cb) {

  debugger;

  let liveSumanServer = false;

  if (process.argv.indexOf('--live_suman_server') > -1) { //does our flag exist?
    liveSumanServer = true;
  }

  /*
   note: when debugging with node-inspector process.send is defined
   */

  let timestamp;
  let outputPath = null;
  let networkLog = null;

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

  //TODO: need to properly toggle the value for 'shouldCreateResultsDir'
  su.makeResultsDir(shouldCreateResultsDir && !_suman.usingRunner, function (err) {

    debugger;

    if (err) {

      debugger;
      console.log(err.stack);
      process.exit(constants.EXIT_CODES.ERROR_CREATING_RESULTS_DIR);
    }
    else {

      debugger;

      let server;

      try{
         server = findSumanServer(null);
      }
      catch(err){
        console.log(err.stack || err);
      }

      debugger;

      //TODO: output path name needs to be incremented somehow by test per file, if there is more than 1 test per file
      if (timestamp) {
        try{
          outputPath = path.normalize(su.getHomeDir() + '/suman/test_results/'
            + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');
        }
        catch(err){
          console.log(err.stack || err);
        }
      }

      try {
        fs.unlinkSync(outputPath); //TODO can we remove this unlink call? I guess it's just in case the same timestamp exists..
      }
      catch (err) {
      }


      debugger;

      //TODO: if using runner, the runner should determine if the server is live

      cb(null, new Suman({
        fileName: path.resolve($module.filename),
        outputPath: outputPath,
        usingLiveSumanServer: liveSumanServer,
        networkLog: networkLog,
        server: server,
        interface: _interface
      }));

    }

  });
}

module.exports = makeSuman;
