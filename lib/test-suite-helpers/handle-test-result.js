'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var testErrors = _suman.testErrors = _suman.testErrors || [];
var errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
var stckMapFn = function (item, index) {
    var fst = _suman.sumanOpts.full_stack_traces;
    if (index === 0) {
        return '\t' + item;
    }
    if (fst) {
        return su.padWithXSpaces(4) + item;
    }
    if (String(item).match(/\//) && !String(item).match(/\/node_modules\//) &&
        !String(item).match(/internal\/process\/next_tick.js/)) {
        return su.padWithXSpaces(4) + item;
    }
};
module.exports = function makeHandleTestError(suman) {
    var fileName = suman.fileName;
    return function handleTestError(err, test) {
        if (_suman.sumanUncaughtExceptionTriggered) {
            _suman.logError("runtime error => \"UncaughtException:Triggered\" => halting program.\n[" + __filename + "]");
            return;
        }
        test.error = null;
        if (err) {
            var sumanFatal = err.sumanFatal;
            if (err instanceof Error) {
                test.error = err;
                test.errorDisplay = String(err.stack).split('\n')
                    .filter(function (item) { return item; })
                    .map(stckMapFn)
                    .filter(function (item) { return item; })
                    .join('\n')
                    .concat('\n');
            }
            else if (typeof err.stack === 'string') {
                test.error = err;
                test.errorDisplay = String(err.stack).split('\n')
                    .filter(function (item) { return item; })
                    .map(stckMapFn)
                    .filter(function (item) { return item; })
                    .join('\n')
                    .concat('\n');
            }
            else {
                throw new Error('Suman internal implementation error => invalid error format.');
            }
            if (su.isSumanDebug()) {
                _suman._writeTestError('\n\nTest error: ' + test.desc + '\n\t' + 'stack: ' + test.error.stack + '\n\n');
            }
            testErrors.push(test.error);
        }
        if (test.error) {
            test.error.isFromTest = true;
        }
        suman.logResult(test);
        return test.error;
    };
};
