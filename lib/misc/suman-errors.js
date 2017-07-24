'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var constants = require('../../config/suman-constants').constants;
var fatalRequestReply = require('../helpers/fatal-request-reply').fatalRequestReply;
function SumanError() {
}
SumanError.prototype = Object.create(Error.prototype);
SumanError.prototype.constructor = SumanError;
function control(isThrow, err) {
    if (isThrow) {
        throw err;
    }
    else {
        return err;
    }
}
function filter(suman, isFatal, err) {
    var stack = err.stack || err;
    var firstMatch = false;
    var type = isFatal ? 'FATAL' : 'NON_FATAL_ERR';
    return fatalRequestReply({
        type: type,
        data: {
            msg: stack
        }
    }, function () {
        if (isFatal) {
            process.exit(constants.EXIT_CODES.BAD_CONFIG_OR_PROGRAM_ARGUMENTS);
        }
        else {
            process.stdout.write('\n' + stack + '\n');
        }
    });
}
exports.noHost = function (isThrow) {
    return control(isThrow, new Error('no host defined'));
};
exports.noPort = function (isThrow) {
    return control(isThrow, new Error('no port defined'));
};
exports.badArgs = function (suman, isFatal, err) {
    return filter(suman, isFatal, err);
};
