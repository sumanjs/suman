'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var assert = require("assert");
var su = require("suman-utils");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var general_1 = require("../helpers/general");
var missingHookOrTest = function () {
    var mzg = new Error('Suman implementation error, please report! ' +
        'Neither test nor hook defined, where at least one should be.');
    console.error(mzg.stack);
    _suman.writeTestError(mzg.stack);
    return mzg;
};
var planHelper = function (e, testOrHook, assertCount) {
    if (testOrHook.planCountExpected !== undefined) {
        assert(Number.isInteger(testOrHook.planCountExpected), 'Suman usage error => "plan" option must be an integer.');
    }
    if (Number.isInteger(testOrHook.planCountExpected) && testOrHook.planCountExpected !== assertCount.num) {
        testOrHook.errorPlanCount = 'Error => Expected plan count was ' + testOrHook.planCountExpected +
            ' but actual assertion/confirm count was ' + assertCount.num;
        var newErr = general_1.cloneError(testOrHook.warningErr, testOrHook.errorPlanCount);
        e = e ? new Error(su.getCleanErrStr(e) + '\n' + newErr.stack) : newErr;
    }
    return e;
};
var throwsHelper = function (err, test, hook) {
    var testOrHook = (test || hook);
    if (testOrHook.throws !== undefined) {
        assert(testOrHook.throws instanceof RegExp, 'Suman usage error => "throws" option must be a RegExp instance.');
        var z = void 0;
        if (!err) {
            z = testOrHook.didNotThrowErrorWithExpectedMessage =
                'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , ' +
                    'but did not throw or pass any error.';
            err = general_1.cloneError(testOrHook.warningErr, z);
            if (hook) {
                err.sumanFatal = true;
                err.sumanExitCode = constants.EXIT_CODES.HOOK_DID_NOT_THROW_EXPECTED_ERROR;
            }
        }
        else if (err && !String(err.stack || err).match(testOrHook.throws)) {
            z = testOrHook.didNotThrowErrorWithExpectedMessage =
                'Error => Expected to throw an error matching regex (' + testOrHook.throws + ') , ' +
                    'but did not throw or pass any error.';
            var newErr = general_1.cloneError(testOrHook.warningErr, z);
            err = new Error(err.stack + '\n' + newErr.stack);
        }
        else {
            err = null;
        }
    }
    return err;
};
exports.makeAllHookCallback = function (d, assertCount, hook, timerObj, gracefulExit, cb) {
    var calledCount = 0;
    return function testAndHookCallbackHandler(err, isTimeout) {
        var sumanOpts = _suman.sumanOpts;
        if (err) {
            if (String(err.stack || err).match(/Suman usage error/)) {
                err.sumanFatal = true;
                err.sumanExitCode = constants.EXIT_CODES.ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS;
                return gracefulExit(err);
            }
            if (Array.isArray(err)) {
                err = new Error(err.map(function (e) { return (e.stack || (typeof e === 'string' ? e : util.inspect(e))); }).join('\n\n'));
            }
            else {
                err = typeof err === 'object' ? err : new Error(typeof err === 'string' ? err : util.inspect(err));
            }
            err.isTimeoutErr = isTimeout || false;
        }
        if (++calledCount === 1) {
            if (sumanOpts.debug_hooks) {
                if (d.testDescription) {
                    _suman.log.info("each hook with name '" + chalk.yellow.bold(hook.desc) + "' has completed, " +
                        ("for test case with name '" + chalk.magenta(d.testDescription) + "'."));
                }
                else {
                    _suman.log.info("hook with name '" + chalk.yellow(hook.desc) + "' has completed.");
                }
            }
            try {
                err = planHelper(err, hook, assertCount);
                err = throwsHelper(err, null, hook);
            }
            catch ($err) {
                err = $err;
            }
            if (testAndHookCallbackHandler.th) {
                testAndHookCallbackHandler.th.emit('done', err);
                testAndHookCallbackHandler.th.removeAllListeners();
            }
            if (d !== process.domain) {
                _suman.log.warning('Suman implementation warning: diverging domains in handle callback helper.');
            }
            try {
                d.exit();
            }
            catch (err) {
                err && _suman.log.error(err.stack || err);
            }
            clearTimeout(timerObj.timer);
            if (err) {
                err.sumanFatal = err.sumanFatal || !!((hook && hook.fatal !== false) || _suman.sumanOpts.bail);
                if (sumanOpts.bail) {
                    err.sumanExitCode = constants.EXIT_CODES.HOOK_ERROR_AND_BAIL_IS_TRUE;
                }
            }
            gracefulExit(err, function () {
                process.nextTick(cb, null, err);
            });
        }
        else {
            if (err) {
                _suman.writeTestError(err.stack || err);
            }
            if (calledCount > 1 && !hook.timedOut) {
                _suman.writeTestError('\n\nWarning: the following test callback was invoked twice by your code ' +
                    'for the following hook with name => "' + (hook.desc || '(hook has no description)') + '".\n\n');
                _suman.writeTestError('The problematic hook can be located from this error trace => \n' +
                    general_1.cloneError(hook.warningErr, 'The callback was fired more than once for this test case.').stack);
            }
        }
    };
};
exports.makeEachHookCallback = function (d, assertCount, hook, timerObj, gracefulExit, cb) {
    var calledCount = 0;
    return function testAndHookCallbackHandler(err, isTimeout) {
        var sumanOpts = _suman.sumanOpts;
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
        if (++calledCount === 1) {
            if (sumanOpts.debug_hooks) {
                if (d.testDescription) {
                    _suman.log.info("each hook with name '" + chalk.yellow.bold(hook.desc) + "' has completed, " +
                        ("for test case with name '" + chalk.magenta(d.testDescription) + "'."));
                }
                else {
                    _suman.log.info("hook with name '" + chalk.yellow(hook.desc) + "' has completed.");
                }
            }
            try {
                err = planHelper(err, hook, assertCount);
                err = throwsHelper(err, null, hook);
            }
            catch ($err) {
                err = $err;
            }
            if (testAndHookCallbackHandler.th) {
                testAndHookCallbackHandler.th.emit('done', err);
                testAndHookCallbackHandler.th.removeAllListeners();
            }
            if (d !== process.domain) {
                _suman.log.warning('Suman implementation warning: diverging domains in handle callback helper.');
            }
            try {
                d.exit();
            }
            catch (err) {
                err && _suman.log.error(err.stack || err);
            }
            clearTimeout(timerObj.timer);
            if (err) {
                err.sumanFatal = err.sumanFatal || !!((hook && hook.fatal !== false) || _suman.sumanOpts.bail);
                if (sumanOpts.bail) {
                    if (hook) {
                        err.sumanExitCode = constants.EXIT_CODES.HOOK_ERROR_AND_BAIL_IS_TRUE;
                    }
                    else {
                        throw missingHookOrTest();
                    }
                }
            }
            gracefulExit(err, function () {
                process.nextTick(cb, null, err);
            });
        }
        else {
            if (err) {
                _suman.writeTestError(err.stack || err);
            }
            if (calledCount > 1 && !hook.timedOut) {
                _suman.writeTestError('\n\nWarning: the following test callback was invoked twice by your code ' +
                    'for the following hook with name => "' + (hook.desc || '(hook has no description)') + '".\n\n');
                _suman.writeTestError('The problematic hook can be located from this error trace => \n' +
                    general_1.cloneError(hook.warningErr, 'The callback was fired more than once for this test case.').stack);
            }
        }
    };
};
exports.makeTestCaseCallback = function (d, assertCount, test, timerObj, gracefulExit, cb) {
    var calledCount = 0;
    return function testCaseCallbackHandler(err, isTimeout) {
        var sumanOpts = _suman.sumanOpts;
        if (err) {
            if (String(err.stack || err).match(/Suman usage error/)) {
                err.sumanFatal = true;
                err.sumanExitCode = constants.EXIT_CODES.ASYCNCHRONOUS_REGISTRY_OF_TEST_BLOCK_METHODS;
                return gracefulExit(err);
            }
            if (Array.isArray(err)) {
                err = new Error(err.map(function (e) { return (e.stack || (typeof e === 'string' ? e : util.inspect(e))); }).join('\n\n'));
            }
            else {
                err = typeof err === 'object' ? err : new Error(typeof err === 'string' ? err : util.inspect(err));
            }
            err.isTimeoutErr = isTimeout || false;
        }
        if (++calledCount === 1) {
            try {
                err = planHelper(err, test, assertCount);
                err = throwsHelper(err, test, null);
            }
            catch ($err) {
                err = $err;
            }
            if (testCaseCallbackHandler.th) {
                testCaseCallbackHandler.th.emit('done', err);
                testCaseCallbackHandler.th.removeAllListeners();
            }
            if (d !== process.domain) {
                _suman.log.warning('Suman implementation warning: diverging domains in handle callback helper.');
            }
            try {
                d.exit();
            }
            catch (err) {
                _suman.log.error(err.stack || err);
            }
            clearTimeout(timerObj.timer);
            if (err) {
                err.sumanFatal = err.sumanFatal || _suman.sumanOpts.bail;
                test.error = err;
                if (_suman.sumanOpts.bail) {
                    err.sumanExitCode = constants.EXIT_CODES.TEST_ERROR_AND_BAIL_IS_TRUE;
                }
            }
            else {
                test.complete = true;
                test.dateComplete = Date.now();
            }
            process.nextTick(cb, null, err);
        }
        else {
            if (err) {
                _suman.writeTestError(err.stack || err);
            }
            if (calledCount > 1 && !test.timedOut) {
                _suman.writeTestError('Warning: the following test callback was invoked twice by your code ' +
                    'for the following test/hook with name => "' + (test ? test.desc : '') + '".');
                _suman.writeTestError('The problematic test case can be located from this error trace => \n' +
                    general_1.cloneError(test.warningErr, 'The callback was fired more than once for this test case.').stack);
            }
        }
    };
};
