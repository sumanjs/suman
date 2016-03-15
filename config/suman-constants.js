/**
 * Created by denman on 1/12/16.
 */


//unfortunately using Object.freeze prevents code completion, FOL

module.exports = Object.freeze({

    SUMAN_SERVER_MESSAGE: 'SUMAN_SERVER_MESSAGE',
    SUMAN_HARD_LIST: ['delay', 'suite'],
    CORE_MODULE_LIST: require('builtin-modules')

});