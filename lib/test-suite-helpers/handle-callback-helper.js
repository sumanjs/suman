'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var assert = require('assert');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var clone_error_1 = require("../misc/clone-error");
function missingHookOrTest() {
    var mzg = new Error(' => Suman implementation error, please report! ' +
        'Neither test nor hook defined, where at least one should be.');
    console.error(mzg.stack);
    _suman._writeTestError(mzg.stack);
    return mzg;
}
function planHelper(e, test, hook, assertCount) {
    var testOrHook = (test || hook);
    if (testOrHook.planCountExpected !== undefined) {
        assert(Number.isInteger(testOrHook.planCountExpected), ' => Suman usage error => "plan" option must be an integer.');
    }
    if (Number.isInteger(testOrHook.planCountExpected) && testOrHook.planCountExpected !== assertCount.num) {
        testOrHook.errorPlanCount = 'Error => Expected plan count was ' + testOrHook.planCountExpected +
            ' but actual assertion/confirm count was ' + assertCount.num;
        var newErr = clone_error_1.cloneError(testOrHook.warningErr, testOrHook.errorPlanCount);
        if (e) {
            e = new Error((e.stack || e) + '\n' + newErr.stack);
        }
        else {
            e = newErr;
        }
    }
    return e;
}
function throwsHelper(err, test, hook) {
    var testOrHook = (test || hook);
    if (testOrHook.throws !== undefined) {
        assert(testOrHook.throws instanceof RegExp, ' => Suman usage error => "throws" option must be a RegExp.');
        var z = void 0;
        if (!err) {
            z = testOrHook.didNotThrowErrorWithExpectedMessage =
                'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , but did not.';
            err = clone_error_1.cloneError(testOrHook.warningErr, z);
            if (hook) {
                err.sumanFatal = true;
                err.sumanExitCode = constants.EXIT_CODES.HOOK_DID_NOT_THROW_EXPECTED_ERROR;
            }
        }
        else if (err && !String(err.stack || err).match(testOrHook.throws)) {
            z = testOrHook.didNotThrowErrorWithExpectedMessage =
                'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , but did not.';
            var newErr = clone_error_1.cloneError(testOrHook.warningErr, z);
            err = new Error(err.stack + '\n' + newErr.stack);
        }
        else {
            err = null;
        }
    }
    return err;
}
exports.makeCallback = function (d, assertCount, test, hook, timerObj, gracefulExit, cb) {
    if (test && hook) {
        throw new Error(' => Suman internal implementation error => Please report this on Github issue tracker.');
    }
    else if (!test && !hook) {
        var msg = new Error(' => Suman implementation error, please report! ' +
            'Neither test nor hook defined, where at least one should be.');
        console.error(msg.stack || msg);
        _suman._writeTestError(msg.stack || msg);
    }
    var called = 0;
    return function testAndHookCallbackHandler(err, isTimeout) {
        if (err) {
            if (String(err.stack || err).match(/Suman usage error/)) {
                err.sumanFatal = true;
                err.sumanExitCode = constants.EXIT_CODES.ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS;
                gracefulExit(err);
                return;
            }
            if (Array.isArray(err)) {
                err = new Error(err.map(function (e) { return (e.stack || (typeof e === 'string' ? e : util.inspect(e))); }).join('\n\n'));
            }
            else {
                err = typeof err === 'object' ? err : new Error(typeof err === 'string' ? err : util.inspect(err));
            }
            err.isTimeoutErr = isTimeout || false;
        }
        if (++called === 1) {
            try {
                if (test || hook) {
                    err = planHelper(err, test, hook, assertCount);
                    err = throwsHelper(err, test, hook);
                }
                else {
                    throw missingHookOrTest();
                }
            }
            catch ($err) {
                err = $err;
            }
            if (testAndHookCallbackHandler.th) {
                testAndHookCallbackHandler.th.emit('done', err);
                testAndHookCallbackHandler.th.removeAllListeners();
            }
            else {
                throw new Error(' => Suman internal implementation error => Please report this!');
            }
            try {
                d.exit();
                clearTimeout(timerObj.timer);
                if (err) {
                    err.sumanFatal = err.sumanFatal || !!((hook && hook.fatal !== false) || _suman.sumanOpts.bail);
                    if (test) {
                        test.error = err;
                    }
                    if (_suman.sumanOpts.bail) {
                        if (test) {
                            err.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE;
                        }
                        else if (hook) {
                            err.sumanExitCode = constants.EXIT_CODES.HOOK_ERROR_AND_BAIL_IS_TRUE;
                        }
                        else {
                            throw missingHookOrTest();
                        }
                    }
                }
                else {
                    if (test) {
                        test.complete = true;
                        test.dateComplete = Date.now();
                    }
                }
            }
            catch ($err) {
                var $msg = '=> Suman internal implementation error, ' +
                    'please report this => \n' + ($err.stack || $err);
                console.error($msg);
                _suman._writeTestError($msg);
            }
            finally {
                if (test) {
                    cb(null, err);
                }
                else {
                    gracefulExit(err, (test || hook), function () {
                        cb(null, err);
                    });
                }
            }
        }
        else {
            if (err) {
                _suman._writeTestError(err.stack || err);
            }
            if (called > 1 && test && !test.timedOut) {
                _suman._writeTestError('Warning: the following test callback was invoked twice by your code ' +
                    'for the following test/hook with name => "' + (test ? test.desc : '') + '".');
                _suman._writeTestError('The problematic test case can be located from this error trace => \n' +
                    clone_error_1.cloneError(test.warningErr, 'The callback was fired more than once for this test case.').stack);
            }
            else if (called > 1 && hook) {
                _suman._writeTestError('\n\nWarning: the following test callback was invoked twice by your code ' +
                    'for the following hook with name => "' + (hook.desc || '(hook has no description)') + '".\n\n');
                _suman._writeTestError('The problematic hook can be located from this error trace => \n' +
                    clone_error_1.cloneError(hook.warningErr, 'The callback was fired more than once for this test case.').stack);
            }
        }
    };
};
