'use striiiict';

//README: note that for reference, all events are listed here, many are noop'ed because of this

//core
const util = require('util');
const suman = require('suman');
const utils = require('suman-utils/utils');

////////////////////////////////////////////////////////////////////////

function noop () {}

function logDebug () {
  var debug;
  if (debug = process.env.SUMAN_DEBUG === 'yes') {
    const args = Array.prototype.slice.call(arguments).filter(i => i);
    args.forEach(function (a) {
      process.stderr.write(typeof a === 'string' ? a : util.inspect(a));
    });
  }
  return debug;
}

function onAnyEvent (data, value) {
  if (!logDebug.apply(null, arguments)) {
    process.stdout.write(data);
  }
}

function onVerboseEvent (data, value) {
  if (!logDebug.apply(null, arguments)) {
    if (global.sumanOpts.verbose) {
      process.stdout.write(data);
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
  s.on('exit-code-greater-than-zero', noop);

  //on any event
  s.on('filename-not-js-file', onAnyEvent);
  s.on('runner-initial-set', onAnyEvent);
  s.on('runner-overall-set', onAnyEvent);
  s.on('runner-ascii-logo', onAnyEvent);
  s.on('fatal-test-error', onAnyEvent);
  s.on('test-case-fail', onAnyEvent);
  s.on('test-case-pass', onAnyEvent);
  s.on('test-case-skipped', onAnyEvent);
  s.on('test-case-stubbed', onAnyEvent);
  s.on('runner-exit-signal', onAnyEvent);
  s.on('suman-runner-exit-code', onAnyEvent);

  //on verbose
  s.on('filename-not-match-any', onVerboseEvent);
  s.on('filename-not-match-none', onVerboseEvent);
  s.on('filename-not-match-any', onVerboseEvent);
  s.on('runner-directory-no-recursive', onVerboseEvent);

  //ignore these
  s.on('runner-start', noop);
  s.on('runner-end', noop);
  s.on('suite-skipped', noop);
  s.on('suite-end', noop);
  s.on('test-end', noop);
  s.on('exit-code-is-zero', noop);

  s.on('runner-test-paths-confirmation', function () {
    if (!global.sumanOpts.sparse || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });

  s.on('suman-runner-results-table', function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });

  s.on('suman-runner-results-table-sorted-by-millis', function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });

  s.on('suman-runner-overall-results-table', function () {
    if (!global.sumanOpts.no_tables || utils.isSumanDebug()) {
      onAnyEvent.apply(null, arguments);
    }
  });
};