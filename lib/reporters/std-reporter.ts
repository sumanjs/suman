'use strict';
import {ISumanChildProcess} from "../../dts/runner";
import EventEmitter = NodeJS.EventEmitter;
import {ITableData} from "../../dts/table-data";
import {IGlobalSumanObj, ISumanOpts} from "../../dts/global";
import {ITestDataObj} from "../../dts/it";

//README: note that just for reference, all events are included here; many are noop'ed because of this

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});
import {events} from 'suman-events';
const su = require('suman-utils');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////

const noColors = process.argv.indexOf('--no-color') > 0;

////////////////////////////////////////////////////////////////////////

function noop() {
}

function logDebug() {
  let debug;
  if (debug = process.env.SUMAN_DEBUG) {
    const args = Array.from(arguments).filter(i => i);
    args.forEach(function (a) {
      process.stderr.write('\n' + (typeof a === 'string' ? a : util.inspect(a)) + '\n');
    });
  }
  return debug;
}


interface IStringVarargs {
  (...args: string[]): void;
}


let onAnyEvent : IStringVarargs = function () {
  if (!logDebug.apply(null, arguments)) {
    const args = Array.from(arguments).map(function (data) {
      return typeof data === 'string' ? data : util.inspect(data);
    });
    return console.log.apply(console, args);
  }
};

function onVerboseEvent(data: any, value?: any) {
  if (!logDebug.apply(null, arguments)) {
    if (_suman.sumanOpts.verbosity > 6) {
      process.stdout.write(' => \n\t' + (typeof data === 'string' ? data : util.inspect(data)) + '\n\n');
      if (value) {
        process.stdout.write(' => \n\t' + (typeof value === 'string' ? value : util.inspect(value)) + '\n\n');
      }
    }
  }
}

function onError(data: string) {
  if (!logDebug.apply(null, arguments)) {
    process.stderr.write(data);
  }
}

/////////////////////////////////////////////////////////////////////////////////////

let count = 0;

/////////////////////////////////////////////////////////////////////////////////////


export = (s: EventEmitter, sumanOpts: ISumanOpts) => {

  count++;
  if (count > 1) {
    throw new Error('Suman implementation error => Suman standard reporter loaded more than once.');
  }

  //on error
  s.on(String(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO), noop);

  //on any event
  s.on(String(events.FILE_IS_NOT_DOT_JS), function (dir: string) {
    onAnyEvent('\n => Warning -> Suman will attempt to execute the following file:\n "' +
      colors.cyan(dir) + '",\n (which is not a .js file).\n');
  });

  s.on(String(events.RUNNER_INITIAL_SET),
    function (forkedCPs: Array<ISumanChildProcess>, processes: string, suites: string) {
      onAnyEvent('\n\n\t',colors.bgBlue.yellow(' => [Suman runner] =>  initial set => ' +
          forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' '),'\n');
    });

  s.on(String(events.RUNNER_OVERALL_SET),
    function (totalCount: number, processes: string, suites: string, addendum: string) {
      onAnyEvent('\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  overall set => '
          + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + (suites + addendum) + ' ') + '\n\n\n');
    });

  s.on(String(events.RUNNER_ASCII_LOGO), function (logo: string) {
    onAnyEvent('\n\n' + logo + '\n\n')
  });

  s.on(String(events.FATAL_TEST_ERROR), onAnyEvent);

  s.on(String(events.TEST_CASE_FAIL), function (test: ITestDataObj) {

    if (_suman.processIsRunner) {
      onAnyEvent('\n\n\t' + colors.bgWhite.black.bold(' ' + (noColors ? '(x)' : '\u2718') + '   => test fail ') + '  \'' +
        test.desc + '\'\n\t' + colors.bgYellow.gray(' Originating entry test path => ')
        + colors.bgYellow.black.bold(test.sumanModulePath + ' ') + '\n' + colors.yellow(test.errorDisplay) + '\n\n');
    }
    else {
      onAnyEvent('\n\n\t' +
        colors.bgWhite.black.bold(' ' + (noColors ? '(x)' : '\u2718') + '  => test fail ') + '  "' +
        test.desc + '"\n' + colors.yellow(test.errorDisplay) + '\n\n');
    }
  });

  s.on(String(events.TEST_CASE_PASS), function (test: ITestDataObj) {

    onAnyEvent('\t' +
      colors.blue(' ' + (noColors ? '(check)' : '\u2714 ')) + ' \'' + (test.desc || test.name) + '\' ' +
      (test.dateComplete ? '(' + ((test.dateComplete - test.dateStarted) || '< 1') + 'ms)' : '') + '\n');
  });

  s.on(String(events.TEST_CASE_SKIPPED), function (test: ITestDataObj) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( - )' : '\u21AA ')) + ' (skipped) \'' +
      test.desc + '\'\n');
  });

  s.on(String(events.TEST_CASE_STUBBED), function (test: ITestDataObj) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( --- )' : '\u2026 ')) + ' (stubbed) \'' +
      test.desc + '\'\n');
  });

  s.on(String(events.STANDARD_TABLE), function(table: ITableData){
    if (!sumanOpts.no_tables){
      console.log('\n\n');
      let str = table.toString();
      str = '\t' + str;
      console.log(str.replace(/\n/g, '\n\t'));
      console.log('\n');
    }
  });

  s.on(String(events.RUNNER_EXIT_SIGNAL), function (signal: any) {
    onAnyEvent(['<::::::::::::::::::::: Runner Exit Signal => ' + signal + ' ::::::::::::::::::::::::>'].join('\n'));
  });

  s.on(String(events.RUNNER_EXIT_CODE), function (code: number) {
    onAnyEvent(['\n  ',
      ' <::::::::::::::::::::::::::::::::: Suman runner exiting with exit code: ' + code +
      ' :::::::::::::::::::::::::::::::::>', '\n'].join('\n'));
  });

  //on verbose
  s.on(String(events.ERRORS_ONLY_OPTION), function () {
    onVerboseEvent('\n' + colors.white.green.bold(' => ' + colors.white.bold('"--errors-only"')
        + ' option used, hopefully you don\'t see much output until the end :) '), '\n');
  });

  s.on(String(events.USING_SERVER_MARKED_BY_HOSTNAME), onVerboseEvent);
  s.on(String(events.USING_FALLBACK_SERVER), onVerboseEvent);
  s.on(String(events.USING_DEFAULT_SERVER), onVerboseEvent);

  s.on(String(events.FILENAME_DOES_NOT_MATCH_ANY), function (dir: string) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ', ' +
      'but it didnt match the regex(es) you passed in as input for "matchAny".');
  });

  s.on(String(events.FILENAME_DOES_NOT_MATCH_NONE), function (dir: string) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ', ' +
      'but it didnt match the regex(es) you passed in as input for "matchNone".');
  });

  s.on(String(events.FILENAME_DOES_NOT_MATCH_ALL), function (dir: string) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ',' +
      ' but it didnt match the regex(es) you passed in as input for "matchAll"');
  });

  s.on(String(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE), onVerboseEvent);

  //ignore these
  s.on(String(events.RUNNER_STARTED), noop);
  s.on(String(events.RUNNER_ENDED), noop);
  s.on(String(events.SUITE_SKIPPED), noop);
  s.on(String(events.SUITE_END), noop);
  s.on(String(events.TEST_END), noop);
  s.on(String(events.RUNNER_EXIT_CODE_IS_ZERO), noop);

  s.on(String(events.RUNNER_TEST_PATHS_CONFIRMATION), function (files: Array<string>) {
    if (sumanOpts.verbosity > 2 || su.isSumanDebug()) {
      onAnyEvent(['\n ' + colors.bgBlack.white.bold(' Suman will attempt to execute test files with/within the following paths: '),
        '\n\n',
        files.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.cyan('"' + p + '"')).join('\n') + '\n\n\n'].join(''))
    }
  });

  s.on(String(events.RUNNER_RESULTS_TABLE), function (allResultsTableString: string) {
    if (!sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent('\n\n' + allResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(String(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS), function (strSorted: string) {
    if (!sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent('\n\n' + strSorted.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(String(events.RUNNER_OVERALL_RESULTS_TABLE), function (overallResultsTableString: string) {
    if (!sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent(overallResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });
};
