/**
 * Created by denman on 1/12/16.
 */


//unfortunately using Object.freeze prevents code completion, FOL

module.exports = Object.freeze({

    SUMAN_SERVER_MESSAGE: 'SUMAN_SERVER_MESSAGE',
    SUMAN_HARD_LIST: ['delay', 'suite', 'before', 'after', 'beforeEach', 'afterEach', 'it', 'test', 'describe', 'context'],
    CORE_MODULE_LIST: require('builtin-modules'),
    EXIT_CODES: {
        UNEXPECTED_FATAL_ERROR: 59,
        FATAL_TEST_ERROR: 60,
        FATAL_HOOK_ERROR: 61,
        SUITE_TIMEOUT: 62,
        SUITE_BAIL: 63
    }

});