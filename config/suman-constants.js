/**
 * Created by denman on 1/12/16.
 */


module.exports = Object.freeze({

    OLDEST_SUPPORTED_NODE_VERSION: 'v4.0.0',
    DEBUGGING_ENV: {
        name: 'SUMAN_DEBUG',
        value: 'on'
    },
    SUMAN_SERVER_MESSAGE: 'SUMAN_SERVER_MESSAGE',
    GIT_IGNORE: [
        '\n',
        '*suman/logs/',
        'test-target/'
    ],
    SUMAN_HARD_LIST: [
        'delay',
        'suite',
        'before',
        'after',
        'beforeEach',
        'afterEach',
        'it',
        'test',
        'describe',
        'context',
        'extra',
        '$uda',
        'writable'
    ],
    CORE_MODULE_LIST: require('builtin-modules'),
    RUNNER_EXIT_CODES: {
        NO_TEST_FILE_OR_DIR_SPECIFIED: 30,
        ERROR_INVOKING_NETWORK_LOG_IN_RUNNER: 31,
        UNEXPECTED_FATAL_ERROR: 32,
        TIMED_OUT_AFTER_ALL_PROCESSES_EMIT_EXIT: 33,
        UNCAUGHT_EXCEPTION: 777
    },
    EXIT_CODES: {
        SUCCESSFUL_RUN: 0,
        WHOLE_TEST_SUITE_SKIPPED: 0,
        GREP_SUITE_DID_NOT_MATCH: 0,
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
        ERROR_IN_ROOT_SUITE: 66,
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
        OPTS_PLAN_NOT_A_NUMBER: 84,
        UNEXPECTED_FATAL_ERROR_DOMAIN_CAUGHT: 85,
        HOOK_ERROR_AND_BAIL_IS_TRUE: 86,
        HOOK_TIMED_OUT_ERROR: 87
        // NO_DATA_RECEIVED_FROM_FILE: 85
    },
    ERROR_MESSAGES: {
        INVALID_FUNCTION_TYPE_USAGE: ' => Suman fatal error => You cannot use arrow functions, geneators or async/await with describe callbacks; however, you may these functions everywhere else.\n' +
        'The reason is because every describe call creates a new nested test instance, and "this" is bound to that instance; \nfurthermore describe function callbacks need to register' +
        ' all hooks and test cases synchronously, which is why generator functions and async/await are not permitted either. \n\nBottom line: For every describe call, you ' +
        'need a regular function as a callback. \nIf you dont understand why, read up on how arrow functions bind "this" ' +
        'to lexical scope, and why they cant just be used everywhere.'
    },
    runner_message_type: {
        FATAL: 'FATAL',
        TABLE_DATA: 'TABLE_DATA',
        INTEGRANT_INFO: 'INTEGRANT_INFO',
        LOG_DATA: 'LOG_DATA',
        LOG_RESULT: 'LOG_RESULT',
        FATAL_SOFT: 'FATAL_SOFT',
        WARNING: 'WARNING',
        NON_FATAL_ERR: 'NON_FATAL_ERR',
        CONSOLE_LOG: 'CONSOLE_LOG',
        MAX_MEMORY: 'MAX_MEMORY',
        TABLE_DATA_RECEIVED: 'TABLE_DATA_RECEIVED'
    },
    broadcast_event_type: {
        TEST_CASE_FAIL: 'test-case-fail',
        TEST_CASE_PASS: 'test-case-pass',
        TEST_CASE_STUBBED: 'test-case-stubbed',
        TEST_CASE_SKIPPED: 'test-case-skipped'
    },
    warnings: {
        NO_DONE_WARNING: 'Warning: no done referenced in callback',
        RETURNED_VAL_DESPITE_CALLBACK_MODE: 'Warning: callback mode is set, but a non-null value was returned by the hook',
        TEST_CASE_TIMED_OUT_ERROR: 'Error: *timed out* - did you forget to call t.done()/t.pass()/t.fail()?',
        HOOK_TIMED_OUT_ERROR: 'Error: *timed out* - did you forget to call t.done()/t.ctn()/t.fatal()?',
        DELAY_TIMED_OUT_ERROR: 'Error: *timed out* - did you forget to call delay()?'
    },
    tableData: {

        SUITES_DESIGNATOR: {
            name: 'SUITES => ',
            default: '(!!error!!)'
        },
        ROOT_SUITE_NAME: {
            name: 'Root Suite Name',
            default: '(unknown)'
        },
        SUITE_COUNT: {
            name: '+total',
            default: '-'
        },
        SUITE_SKIPPED_COUNT: {
            name: '+skipped',
            default: '-'
        },
        TEST_CASES_DESIGNATOR: {
            name: 'TEST CASES =>',
            default: ''
        },
        TEST_CASES_TOTAL: {
            name: '*total',
            default: '-'
        },
        TEST_CASES_PASSED: {
            name: '*passed',
            default: '-'
        },
        TEST_CASES_FAILED: {
            name: '*failed',
            default: '-'
        },
        TEST_CASES_SKIPPED: {
            name: '*skipped',
            default: '-'
        },
        TEST_CASES_STUBBED: {
            name: '*stubbed',
            default: '-'
        },
        OVERALL_DESIGNATOR: {
            name: 'OVERALL =>',
            default: '(not received)',
            allowEmptyString: true
        },
        TEST_SUITE_MILLIS: {
            name: 'millis',
            default: null
        },
        TEST_SUITE_EXIT_CODE: {
            name: 'exit-code',
            default: '-'
        }
    }

});