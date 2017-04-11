'use strict';

//README: note that just for reference, all events are included here; many are noop'ed because of this

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const events = require('suman-events');
const su = require('suman-utils');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////

const noColors = process.argv.indexOf('--no-color') > 0;

////////////////////////////////////////////////////////////////////////

function noop () {}

function logDebug () {
  let debug;
  if (debug = process.env.SUMAN_DEBUG) {
    const args = Array.from(arguments).filter(i => i);
    args.forEach(function (a) {
      process.stderr.write('\n' + (typeof a === 'string' ? a : util.inspect(a)) + '\n');
    });
  }
  return debug;
}

function onAnyEvent (data, value) {
  if (!logDebug.apply(null, arguments)) {
    process.stdout.write(typeof data === 'string' ? data : util.inspect(data));
  }
}

function onVerboseEvent (data, value) {
  if (!logDebug.apply(null, arguments)) {
    if (_suman.sumanOpts.verbose) {
      process.stdout.write(' => \n\t' + (typeof data === 'string' ? data : util.inspect(data)) + '\n\n');
      if (value) {
        process.stdout.write(' => \n\t' + (typeof value === 'string' ? value : util.inspect(value)) + '\n\n');
      }
    }
  }
}

function onError (data, value) {
  if (!logDebug.apply(null, arguments)) {
    process.stderr.write(data);
  }
}

/////////////////////////////////////////////////////////////////////////////////////

let count = 0;

/////////////////////////////////////////////////////////////////////////////////////

module.exports = s => {

  count++;
  if(count > 1){
    throw new Error('Implementation error => Suman standard reporter loaded more than once.');
  }

  //on error
  s.on(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO, noop);

  //on any event
  s.on(events.FILE_IS_NOT_DOT_JS, function (dir) {
    onAnyEvent('\n => Warning -> Suman will attempt to execute the following file:\n "' +
      colors.cyan(dir) + '",\n (which is not a .js file).\n');
  });

  s.on(events.RUNNER_INITIAL_SET, function (forkedCPs, processes, suites) {
    onAnyEvent('\n\n\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  initial set => ' +
        forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' ') + '\n');
  });

  s.on(events.RUNNER_OVERALL_SET, function (totalCount, processes, suites, addendum) {
    onAnyEvent('\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  overall set => '
        + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + (suites + addendum) + ' ') + '\n\n\n');
  });

  s.on(events.RUNNER_ASCII_LOGO, function (logo) {
    onAnyEvent('\n\n' + logo + '\n\n')
  });

  s.on(events.FATAL_TEST_ERROR, onAnyEvent);

  s.on(events.TEST_CASE_FAIL, function (test) {

    if (_suman.processIsRunner) {
      onAnyEvent('\n\n\t' + colors.bgWhite.black.bold(' ' + (noColors ? '(x)' : '\u2718') + '   => test fail ') + '  \'' +
        (test.desc || test.name) + '\'\n\t' + colors.bgYellow.black(' Originating entry test path => ')
        + colors.bgYellow.gray.bold(test.sumanModulePath + ' ') + '\n' + colors.yellow(test.errorDisplay) + '\n\n');
    }
    else {
      onAnyEvent('\n\n\t' +
        colors.bgWhite.black.bold(' ' + (noColors ? '(x)' : '\u2718') + '  => test fail ') + '  "' +
        (test.desc || test.name) + '"\n' + colors.yellow(test.errorDisplay) + '\n\n');
    }
  });

  s.on(events.TEST_CASE_PASS, function (test) {

    onAnyEvent('\t' +
      colors.blue(' ' + (noColors ? '(check)' : '\u2714 ')) + ' \'' + (test.desc || test.name) + '\' ' +
      (test.dateComplete ? '(' + ((test.dateComplete - test.dateStarted) || '< 1') + 'ms)' : '') + '\n');
  });

  s.on(events.TEST_CASE_SKIPPED, function (test) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( - )' : '\u21AA ')) + ' (skipped) \'' +
      (test.desc || test.name) + '\'\n');
  });

  s.on(events.TEST_CASE_STUBBED, function (test) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( --- )' : '\u2026 ')) + ' (stubbed) \'' +
      (test.desc || test.name) + '\'\n');
  });

  s.on(events.RUNNER_EXIT_SIGNAL, function (signal) {
    onAnyEvent(['<::::::::::::::::::::: Runner Exit Signal => ' + signal + ' ::::::::::::::::::::::::>'].join('\n'));
  });

  s.on(events.RUNNER_EXIT_CODE, function (code) {
    onAnyEvent(['\n  ',
      ' <::::::::::::::::::::::::::::::::: Suman runner exiting with exit code: ' + code +
      ' :::::::::::::::::::::::::::::::::>', '\n'].join('\n'));
  });

  //on verbose
  s.on(events.ERRORS_ONLY_OPTION, function () {
    onVerboseEvent('\n' + colors.white.green.bold(' => ' + colors.white.bold('"--errors-only"')
        + ' option used, hopefully you don\'t see much output until the end :) '), '\n');
  });

  s.on(events.USING_SERVER_MARKED_BY_HOSTNAME, onVerboseEvent);
  s.on(events.USING_FALLBACK_SERVER, onVerboseEvent);
  s.on(events.USING_DEFAULT_SERVER, onVerboseEvent);

  s.on(events.FILENAME_DOES_NOT_MATCH_ANY, function (dir) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ', ' +
      'but it didnt match the regex(es) you passed in as input for "matchAny".');
  });

  s.on(events.FILENAME_DOES_NOT_MATCH_NONE, function (dir) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ', ' +
      'but it didnt match the regex(es) you passed in as input for "matchNone".');
  });

  s.on(events.FILENAME_DOES_NOT_MATCH_ALL, function (dir) {
    onVerboseEvent('\n => You may have wanted to run file with this name:' + dir + ',' +
      ' but it didnt match the regex(es) you passed in as input for "matchAll"');
  });

  s.on(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE, onVerboseEvent);

  //ignore these
  s.on(events.RUNNER_STARTED, noop);
  s.on(events.RUNNER_ENDED, noop);
  s.on(events.SUITE_SKIPPED, noop);
  s.on(events.SUITE_END, noop);
  s.on(events.TEST_END, noop);
  s.on(events.RUNNER_EXIT_CODE_IS_ZERO, noop);

  s.on(events.RUNNER_TEST_PATHS_CONFIRMATION, function (files) {
    if (!_suman.sumanOpts.sparse || su.isSumanDebug()) {
      onAnyEvent(['\n ' + colors.bgBlack.white.bold(' Suman will attempt to execute test files with/within the following paths: '),
        '\n\n',
        files.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.cyan('"' + p + '"')).join('\n') + '\n\n\n'].join(''))
    }
  });

  s.on(events.RUNNER_RESULTS_TABLE, function (allResultsTableString) {
    if (!_suman.sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent('\n\n' + allResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS, function (strSorted) {
    if (!_suman.sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent('\n\n' + strSorted.replace(/\n/g, '\n\t') + '\n\n')
    }
  });

  s.on(events.RUNNER_OVERALL_RESULTS_TABLE, function (overallResultsTableString) {
    if (!_suman.sumanOpts.no_tables || su.isSumanDebug()) {
      onAnyEvent(overallResultsTableString.replace(/\n/g, '\n\t') + '\n\n')
    }
  });
};
