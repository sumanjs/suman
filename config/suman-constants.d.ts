export declare const constants: Readonly<{
    DEFAULT_PARALLEL_TOTAL_LIMIT: number;
    DEFAULT_PARALLEL_TEST_LIMIT: number;
    DEFAULT_PARALLEL_BLOCK_LIMIT: number;
    OLDEST_SUPPORTED_NODE_VERSION: string;
    DEBUGGING_ENV: {
        name: string;
        value: string;
    };
    SUMAN_SERVER_MESSAGE: string;
    GIT_IGNORE: string[];
    SUMAN_HARD_LIST: string[];
    CORE_MODULE_LIST: any;
    CLI_EXIT_CODES: {
        NO_GROUP_NAME_MATCHED_COMMAND_LINE_INPUT: number;
    };
    RUNNER_EXIT_CODES: {
        NO_TEST_FILE_OR_DIR_SPECIFIED: number;
        ERROR_INVOKING_NETWORK_LOG_IN_RUNNER: number;
        UNEXPECTED_FATAL_ERROR: number;
        TIMED_OUT_AFTER_ALL_PROCESSES_EMIT_EXIT: number;
        NO_TEST_FILES_MATCHED_OR_FOUND: number;
        UNCAUGHT_EXCEPTION: number;
    };
    EXIT_CODES: {
        SUCCESSFUL_RUN: number;
        WHOLE_TEST_SUITE_SKIPPED: number;
        GREP_SUITE_DID_NOT_MATCH: number;
        FILE_OR_DIRECTORY_DOES_NOT_EXIST: number;
        SUMAN_PRE_NOT_FOUND_IN_YOUR_PROJECT: number;
        SUMAN_HELPER_FILE_DOES_NOT_EXPORT_EXPECTED_FUNCTION: number;
        BAD_GREP_SUITE_OPTION: number;
        SUMAN_UNCAUGHT_EXCEPTION: number;
        BAD_CONFIG_OR_PROGRAM_ARGUMENTS: number;
        UNEXPECTED_NON_FATAL_ERROR: number;
        TEST_CASE_FAIL: number;
        INVALID_ARROW_FUNCTION_USAGE: number;
        BAD_COMMAND_LINE_OPTION: number;
        UNEXPECTED_FATAL_ERROR: number;
        FATAL_TEST_ERROR: number;
        FATAL_HOOK_ERROR: number;
        SUITE_TIMEOUT: number;
        SUITE_BAIL: number;
        INTEGRANT_VERIFICATION_FAILURE: number;
        UNKNOWN_RUNNER_CHILD_PROCESS_STATE: number;
        ERROR_IN_ROOT_SUITE_BLOCK: number;
        IOC_DEPS_ACQUISITION_ERROR: number;
        EXPORT_TEST_BUT_RAN_TEST_FILE_DIRECTLY: number;
        DELAY_NOT_REFERENCED: number;
        INTEGRANT_VERIFICATION_ERROR: number;
        ERROR_CREATED_SUMAN_OBJ: number;
        IOC_PASSED_TO_SUMAN_INIT_BAD_FORM: number;
        ERROR_ACQUIRING_IOC_DEPS: number;
        INVALID_RUNNER_CHILD_PROCESS_STATE: number;
        NO_TIMESTAMP_AVAILABLE_IN_TEST: number;
        ERROR_CREATED_NETWORK_LOG: number;
        ERROR_CREATING_RESULTS_DIR: number;
        COULD_NOT_FIND_CONFIG_FROM_PATH: number;
        TEST_ERROR_AND_BAIL_IS_TRUE: number;
        ERROR_PASSED_AS_FIRST_ARG_TO_DELAY_FUNCTION: number;
        DELAY_FUNCTION_TIMED_OUT: number;
        ERROR_IN_CHILD_SUITE: number;
        OPTS_PLAN_NOT_AN_INTEGER: number;
        UNEXPECTED_FATAL_ERROR_DOMAIN_CAUGHT: number;
        HOOK_ERROR_AND_BAIL_IS_TRUE: number;
        HOOK_TIMED_OUT_ERROR: number;
        UNCAUGHT_EXCEPTION_BEFORE_ONCE_POST_INVOKED: number;
        UNCAUGHT_EXCEPTION_AFTER_ONCE_POST_INVOKED: number;
        ASYNCHRONOUS_CALL_OF_TEST_DOT_DESCRIBE: number;
        COULD_NOT_CREATE_LOG_DIR: number;
        COULD_NOT_LOCATE_SUMAN_HELPERS_DIR: number;
        INTEGRANT_ACQUISITION_TIMEOUT: number;
        EXPECTED_EXIT_CODE_NOT_MET: number;
        ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS: number;
        HOOK_DID_NOT_THROW_EXPECTED_ERROR: number;
        TEST_FILE_TIMEOUT: number;
    };
    ERROR_MESSAGES: {
        INVALID_FUNCTION_TYPE_USAGE: string;
    };
    runner_message_type: {
        FATAL: string;
        TABLE_DATA: string;
        INTEGRANT_INFO: string;
        LOG_DATA: string;
        LOG_RESULT: string;
        FATAL_SOFT: string;
        WARNING: string;
        NON_FATAL_ERR: string;
        CONSOLE_LOG: string;
        MAX_MEMORY: string;
        TABLE_DATA_RECEIVED: string;
    };
    warnings: {
        NO_DONE_WARNING: any;
        RETURNED_VAL_DESPITE_CALLBACK_MODE: any;
        TEST_CASE_TIMED_OUT_ERROR: any;
        HOOK_TIMED_OUT_ERROR: any;
        DELAY_TIMED_OUT_ERROR: string;
    };
    tableData: {
        SUITES_DESIGNATOR: {
            name: string;
            default: string;
        };
        SUITE_COUNT: {
            name: string;
            default: string;
        };
        SUITE_SKIPPED_COUNT: {
            name: string;
            default: string;
        };
        TEST_CASES_DESIGNATOR: {
            name: string;
            default: string;
        };
        TEST_CASES_TOTAL: {
            name: string;
            default: string;
        };
        TEST_CASES_PASSED: {
            name: string;
            default: string;
        };
        TEST_CASES_FAILED: {
            name: string;
            default: string;
        };
        TEST_CASES_SKIPPED: {
            name: string;
            default: string;
        };
        TEST_CASES_STUBBED: {
            name: string;
            default: string;
        };
        OVERALL_DESIGNATOR: {
            name: string;
            default: string;
            allowEmptyString: boolean;
        };
        TEST_FILE_MILLIS: {
            name: string;
            default: any;
        };
        TEST_SUITE_EXIT_CODE: {
            name: string;
            default: string;
        };
    };
    SUMAN_GLOBAL_DEPS: {
        sqlite3: {
            'sqlite3': string;
        };
        sumanSqliteReporter: {
            'suman-sqlite-reporter': string;
        };
        slack: {
            'slack': string;
        };
        babel: {
            'webpack': string;
            'babel-cli': string;
            'babel-core': string;
            'babel-loader': string;
            'babel-polyfill': string;
            'babel-runtime': string;
            'babel-register': string;
            'babel-plugin-transform-runtime': string;
            'babel-preset-es2015': string;
            'babel-preset-es2016': string;
            'babel-preset-react': string;
            'babel-preset-stage-0': string;
            'babel-preset-stage-1': string;
            'babel-preset-stage-2': string;
            'babel-preset-stage-3': string;
            'babel-preset-latest': string;
        };
        sumanServer: {
            'frontail': string;
            'suman-server': string;
        };
        sumanInteractive: {
            'suman-inquirer': string;
            'suman-inquirer-directory': string;
        };
        istanbul: {
            'istanbul': string;
        };
        nyc: {
            'nyc': string;
        };
        typescript: {
            'typescript': string;
        };
    };
}>;
