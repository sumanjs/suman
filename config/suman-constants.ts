'use strict';

import * as chalk from 'chalk';

export const constants = Object.freeze({

  SUMAN_ISSUE_TRACKER_URL: 'https://github.com/sumanjs/suman/issues',
  SUMAN_TYPES_ROOT_URL: 'https://github.com/sumanjs/suman-types/blob/master/dts',

  DEFAULT_TRANSFORM_CONCURRENCY: 3,
  DEFAULT_PARALLEL_TOTAL_LIMIT: 30,
  DEFAULT_PARALLEL_TEST_LIMIT: 10,
  DEFAULT_PARALLEL_BLOCK_LIMIT: 10,

  OLDEST_SUPPORTED_NODE_VERSION: 'v4.0.0',

  DEBUGGING_ENV: {
    name: 'SUMAN_DEBUG',
    value: 'yes'
  },

  SUMAN_SERVER_MESSAGE: 'SUMAN_SERVER_MESSAGE',

  GIT_IGNORE: [
    '**suman/logs/**'
  ],

  SUMAN_HARD_LIST: Object.keys({

    //bdd
    describe: true,
    before: true,
    after: true,
    beforeEach: true,
    afterEach: true,
    it: true,

    //tdd
    suite: true,
    test: true,
    setup: true,
    teardown: true,
    setupTest: true,
    teardownTest: true,

    //all
    $root: true, // root of project
    inject: true,
    $injections: true,
    $macro: true,
    $ioc: true,
    $pre: true,
    $core: true,
    $deps: true,
    resume: true,
    getResumeVal: true,
    getResumeValue: true,
    extraArgs: true,
    userData: true,
    context: true,
    extra: true,
    $uda: true,
    writable: true

  }),

  CORE_MODULE_LIST: require('builtin-modules'),

  CLI_EXIT_CODES: {
    NO_GROUP_NAME_MATCHED_COMMAND_LINE_INPUT: 20,
  },

  RUNNER_EXIT_CODES: {
    NO_TEST_FILE_OR_DIR_SPECIFIED: 30,
    ERROR_INVOKING_NETWORK_LOG_IN_RUNNER: 31,
    UNEXPECTED_FATAL_ERROR: 32,
    TIMED_OUT_AFTER_ALL_PROCESSES_EMIT_EXIT: 33,
    NO_TEST_FILES_MATCHED_OR_FOUND: 34,
    UNCAUGHT_EXCEPTION: 777
  },

  EXIT_CODES: {
    SUCCESSFUL_RUN: 0,
    WHOLE_TEST_SUITE_SKIPPED: 0,
    GREP_SUITE_DID_NOT_MATCH: 0,
    FILE_OR_DIRECTORY_DOES_NOT_EXIST: 49,
    SUMAN_PRE_NOT_FOUND_IN_YOUR_PROJECT: 50,
    SUMAN_HELPER_FILE_DOES_NOT_EXPORT_EXPECTED_FUNCTION: 51,
    BAD_GREP_SUITE_OPTION: 52,
    SUMAN_UNCAUGHT_EXCEPTION: 53,
    BAD_CONFIG_OR_PROGRAM_ARGUMENTS: 54,
    UNEXPECTED_NON_FATAL_ERROR: 55,
    TEST_CASE_FAIL: 56,
    INVALID_ARROW_FUNCTION_USAGE: 57,
    BAD_COMMAND_LINE_OPTION: 58,
    UNEXPECTED_FATAL_ERROR: 59,
    FATAL_TEST_ERROR: 60,
    FATAL_HOOK_ERROR: 61,
    SUITE_TIMEOUT: 62,
    SUITE_BAIL: 63,
    INTEGRANT_VERIFICATION_FAILURE: 64,
    UNKNOWN_RUNNER_CHILD_PROCESS_STATE: 65,
    ERROR_IN_ROOT_SUITE_BLOCK: 66,
    IOC_DEPS_ACQUISITION_ERROR: 67,
    EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY: 68,
    DELAY_NOT_REFERENCED: 69,
    INTEGRANT_VERIFICATION_ERROR: 70,
    ERROR_CREATED_SUMAN_OBJ: 71,
    IOC_PASSED_TO_SUMAN_INIT_BAD_FORM: 72,
    ERROR_ACQUIRING_IOC_DEPS: 73,
    INVALID_RUNNER_CHILD_PROCESS_STATE: 74,
    NO_TIMESTAMP_AVAILABLE_IN_TEST: 75,
    ERROR_CREATED_NETWORK_LOG: 77,
    ERROR_CREATING_RESULTS_DIR: 78,
    COULD_NOT_FIND_CONFIG_FROM_PATH: 79,
    TEST_ERROR_AND_BAIL_IS_TRUE: 80,
    ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION: 81,
    DELAY_FUNCTION_TIMED_OUT: 82,
    ERROR_IN_CHILD_SUITE: 83,
    OPTS_PLAN_NOT_AN_INTEGER: 84,
    UNEXPECTED_FATAL_ERROR_DOMAIN_CAUGHT: 85,
    HOOK_ERROR_AND_BAIL_IS_TRUE: 86,
    HOOK_TIMED_OUT_ERROR: 87,
    UNCAUGHT_EXCEPTION_BEFORE_ONCE_POST_INVOKED: 88,
    UNCAUGHT_EXCEPTION_AFTER_ONCE_POST_INVOKED: 89,
    ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE: 90,
    COULD_NOT_CREATE_LOG_DIR: 91,
    COULD_NOT_LOCATE_SUMAN_HELPERS_DIR: 92,
    INTEGRANT_ACQUISITION_TIMEOUT: 93,
    EXPECTED_EXIT_CODE_NOT_MET: 94,
    ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS: 95,
    HOOK_DID_NOT_THROW_EXPECTED_ERROR: 96,
    TEST_FILE_TIMEOUT: 97,
    IOC_STATIC_ACQUISITION_ERROR: 98,
    PRE_VALS_ERROR: 99
  },

  ERROR_MESSAGES: {
    INVALID_FUNCTION_TYPE_USAGE: ' => Suman fatal error => Note that by default Suman does not allow you to use arrow ' +
    'functions with test blocks.\n' +
    '\n => You can change this by setting "allowArrowFunctionsForTestBlocks" to true in your suman.conf.js file.\n' +
    '\n => In any case, you cannot use generators or async/await with test block callbacks.\n' +
    'This is because test block callbacks need to register' +
    ' all hooks and test cases synchronously,\nwhich is why generator functions and async/await ' +
    'are not permitted.\nNote that if you choose to use arrow functions with test blocks, the expected value for "this" will not be bound correctly,\n' +
    'so as an alternative it is best practice to simply inject the "suite" value which would be the same value for "this".\n' +
    'Please see: xxx.'
  },

  runner_message_type: {
    FATAL: 'FATAL',
    FATAL_MESSAGE_RECEIVED: 'FATAL_MESSAGE_RECEIVED',
    TABLE_DATA: 'TABLE_DATA',
    INTEGRANT_INFO: 'INTEGRANT_INFO',
    LOG_RESULT: 'LOG_RESULT',
    WARNING: 'WARNING',
    NON_FATAL_ERR: 'NON_FATAL_ERR',
    MAX_MEMORY: 'MAX_MEMORY',
    TABLE_DATA_RECEIVED: 'TABLE_DATA_RECEIVED'
  },

  warnings: {
    NO_DONE_WARNING: chalk.bold('Warning: no done referenced in callback'),
    RETURNED_VAL_DESPITE_CALLBACK_MODE: chalk.bold('Warning: callback mode is set, but a non-null value was returned by the hook.'),
    TEST_CASE_TIMED_OUT_ERROR: chalk.bold('Error: *timed out* - did you forget to call t.done()/t.pass()/t.fail()? ' +
      '=> You may have forgotten to fire a callback or perhaps the timeout quantity is too short.'),
    HOOK_TIMED_OUT_ERROR: chalk.bold('Error: *timed out* - did you forget to call t.done()/t.ctn()/t.fatal()? ' +
      'You may have forgotten to fire a callback or perhaps the timeout quantity is too short.'),
    DELAY_TIMED_OUT_ERROR: chalk.bold('Error: *timed out* - did you forget to call delay()?')
  },

  tableData: {

    SUITES_DESIGNATOR: {
      name: ' ▼ Test entry path ▼ ',
      default: '(!! suman error !!)'
    },
    TEST_CASES_DESIGNATOR: {
      name: 'Test cases ▶',
      default: ''
    },
    TEST_CASES_TOTAL: {
      name: 'total',
      default: '-'
    },
    TEST_CASES_PASSED: {
      name: 'passed',
      default: '-'
    },
    TEST_CASES_FAILED: {
      name: 'failed',
      default: '-'
    },
    TEST_CASES_SKIPPED: {
      name: 'skipped',
      default: '-'
    },
    TEST_CASES_STUBBED: {
      name: 'stubbed',
      default: '-'
    },
    OVERALL_DESIGNATOR: {
      name: ' Overall ▶',
      default: '(not received)',
      allowEmptyString: true
    },
    TEST_FILE_MILLIS: {
      name: 'millis',
      default: null
    },
    TEST_SUITE_EXIT_CODE: {
      name: 'exit-code',
      default: '-'
    }
  },

  SUMAN_GLOBAL_DEPS: {

    // gantt: {
    //   'virtual-dom-stringify': 'latest',
    //   'gantt-chart': 'latest'
    // },

    gantt: {
      'handlebars': 'latest'
    },

    sqlite3: {
      'sqlite3': 'latest'
    },
    sumanSqliteReporter: {
      'suman-sqlite-reporter': 'latest',
    },
    slack: {
      'slack': 'latest'
    },
    babel: {
      'webpack': 'latest',
      'babel-cli': 'latest',
      'babel-core': 'latest',
      'babel-loader': 'latest',
      'babel-polyfill': 'latest',
      'babel-runtime': 'latest',
      'babel-register': 'latest',
      'babel-plugin-transform-runtime': 'latest',
      'babel-preset-es2015': 'latest',
      'babel-preset-es2016': 'latest',
      'babel-preset-react': 'latest',
      'babel-preset-stage-0': 'latest',
      'babel-preset-stage-1': 'latest',
      'babel-preset-stage-2': 'latest',
      'babel-preset-stage-3': 'latest',
      'babel-preset-latest': 'latest'
    },

    sumanD: {
      'suman-d': 'latest'
    },
    sumanW: {
      'suman-watch': 'latest'
    },
    sumanServer: {
      'frontail': 'latest',
      'suman-server': 'latest'
    },
    sumanInteractive: {
      'suman-inquirer': 'latest',
      'suman-inquirer-directory': 'latest',
    },
    istanbul: {
      'istanbul': 'latest',
    },
    nyc: {
      'nyc': 'latest'
    },
    typescript: {
      'typescript': 'latest'
    }
  }

});
