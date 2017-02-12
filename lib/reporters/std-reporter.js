'use strict';

//README: note that for reference, all events are listed here, many are noop'ed because of this

//core
const util = require('util');

//project
const events = require('suman-events');
const utils = require('suman-utils/utils');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////

const noColors = process.argv.indexOf('--no-color') > 0;

////////////////////////////////////////////////////////////////////////

function noop () {}

function logDebug () {
  var debug;
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
    if (global.sumanOpts.verbose) {
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

module.exports = s => {

  //on error
  s.on(events.RUNNER_EXIT_CODE_GREATER_THAN_ZERO, noop);

  //on any event
  s.on(events.FILE_IS_NOT_DOT_JS, onAnyEvent);

  s.on(events.RUNNER_INITIAL_SET, function (forkedCPs, processes, suites) {
    onAnyEvent('\n\n\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  initial set => ' +
        forkedCPs.length + ' ' + processes + ' running ' + forkedCPs.length + ' ' + suites + ' ') + '\n');
  });

  s.on(events.RUNNER_OVERALL_SET, function (totalCount, processes, suites, addendum) {
    onAnyEvent('\t ' + colors.bgBlue.yellow(' => [Suman runner] =>  overall set => '
        + totalCount + ' ' + processes + ' will run ' + totalCount + ' ' + (suites + addendum) + ' ') + '\n\n\n');
  });

  s.on(events.RUNNER_ASCII_LOGO, onAnyEvent);
  s.on(events.FATAL_TEST_ERROR, onAnyEvent);

  s.on(events.TEST_CASE_FAIL, function (test) {
    onAnyEvent('\n\n\t' +
      colors.bgWhite.black.bold(' ' + (noColors ? '(x)' : '\u2718') + '  => test fail ') + '  "' +
      test.desc + '"\n' + colors.yellow(test.errorDisplay) + '\n\n', test);
  });

  s.on(events.TEST_CASE_PASS, onAnyEvent);

  s.on(events.TEST_CASE_SKIPPED, function (test) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( - )' : '\u21AA ')) + ' (skipped) \'' + test.desc + '\'\n', test);
  });

  s.on(events.TEST_CASE_STUBBED, function (test) {
    onAnyEvent('\t' + colors.yellow(' ' + (noColors ? '( --- )' : '\u2026 ')) + ' (stubbed) \'' + test.desc + '\'\n', test);
  });

  s.on(events.RUNNER_EXIT_SIGNAL, onAnyEvent);
  s.on(events.RUNNER_EXIT_CODE, onAnyEvent);

  //on verbose
  s.on(events.ERRORS_ONLY_OPTION, function(){
    onVerboseEvent('\n' + colors.bgGreen.white.bold(' => ' + colors.white.bold('"--errors-only"')
      + ' option used, hopefully you don\'t see much output until the end :) '), '\n');
  });

  s.on(events.USING_SERVER_MARKED_BY_HOSTNAME, onVerboseEvent);
  s.on(events.USING_FALLBACK_SERVER, onVerboseEvent);
  s.on(events.USING_DEFAULT_SERVER, onVerboseEvent);
  s.on(events.FILENAME_DOES_NOT_MATCH_ANY, onVerboseEvent);
  s.on(events.FILENAME_DOES_NOT_MATCH_NONE, onVerboseEvent);
  s.on(events.FILENAME_DOES_NOT_MATCH_ALL, onVerboseEvent);
  s.on(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE, onVerboseEvent);

  //ignore these
  s.on(events.RUNNER_STARTED, noop);
  s.on(events.RUNNER_ENDED, noop);
  s.on('suite-skipped', noop);
  s.on('suite-end', noop);
  s.on('test-end', noop);
  s.on(events.RUNNER_EXIT_CODE_IS_ZERO, noop);

  s.on(events.RUNNER_TEST_PATHS_CONFIRMATION, function (files) {
    if (!global.sumanOpts.sparse || utils.isSumanDebug()) {
      onAnyEvent(['\n ' + colors.bgBlack.white.bold(' Suman will attempt to execute test files with/within the following paths: '),
        '\n\n',
        files.map((p, i) => '\t ' + (i + 1) + ' => ' + colors.cyan('"' + p + '"')).join('\n') + '\n\n\n'].join(''))
    }
  });

  s.on(events.RUNNER_RESULTS_TABLE, function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });

  s.on(events.RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS, function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });

  s.on(events.RUNNER_OVERALL_RESULTS_TABLE, function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });
};
