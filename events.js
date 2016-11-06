'use striiiict';


const assert = require('assert');

function makeToString (val) {
  return function () {
    return val;
  }
}

const events = module.exports = Object.freeze({

  // runner events
  RUNNER_EXIT_CODE: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_EXIT_CODE')
  },

  RUNNER_EXIT_SIGNAL: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_EXIT_SIGNAL')
  },

  RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE')
  },

  RUNNER_EXIT_CODE_IS_ZERO: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_EXIT_CODE_IS_ZERO')
  },

  RUNNER_TEST_PATHS_CONFIRMATION: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_TEST_PATHS_CONFIRMATION')
  },

  RUNNER_RESULTS_TABLE: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_RESULTS_TABLE')
  },

  RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_RESULTS_TABLE_SORTED_BY_MILLIS')
  },

  RUNNER_OVERALL_RESULTS_TABLE: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_OVERALL_RESULTS_TABLE')
  },

  RUNNER_STARTED: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_STARTED')
  },

  RUNNER_ENDED: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_ENDED')
  },

  RUNNER_EXIT_CODE_GREATER_THAN_ZERO: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_EXIT_CODE_GREATER_THAN_ZERO')
  },

  RUNNER_INITIAL_SET: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_INITIAL_SET')
  },

  RUNNER_OVERALL_SET: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_OVERALL_SET')
  },

  RUNNER_ASCII_LOGO: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('RUNNER_ASCII_LOGO')
  },


  // perennial events
  TEST_CASE_STUBBED: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('TEST_CASE_STUBBED')
  },

  TEST_CASE_SKIPPED: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('TEST_CASE_SKIPPED')
  },

  TEST_CASE_PASS: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('TEST_CASE_PASS')
  },

  FILENAME_DOES_NOT_MATCH_NONE: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('FILENAME_DOES_NOT_MATCH_NONE')
  },

  FILENAME_DOES_NOT_MATCH_ALL: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('FILENAME_DOES_NOT_MATCH_ALL')
  },

  FILENAME_DOES_NOT_MATCH_ANY: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('FILENAME_DOES_NOT_MATCH_ANY')
  },

  SUITE_SKIPPED: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('SUITE_SKIPPED')
  },

  SUITE_END: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('SUITE_END')
  },

  TEST_END: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('TEST_END')
  },

  TEST_CASE_FAIL: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('TEST_CASE_FAIL')
  },

  FILE_IS_NOT_DOT_JS: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('FILE_IS_NOT_DOT_JS')
  },

  FATAL_TEST_ERROR: {
    explanation: 'runner is started, fires before any test child processes are started.',
    toString: makeToString('FATAL_TEST_ERROR')
  }

});



//validate
Object.keys(events).forEach(function (k) {

  const ev = events[ k ];
  const toStr = String(ev);
  assert(ev.explanation.length > 50, ' => Please provide a more detailed explanation for the event.');

  if (toStr !== k) {
    throw new Error(' => Suman implementation error => toString() on events object is' +
      ' not expected value for key => "' + k + '",\ntoString() val is => ' + toStr);
  }
});


