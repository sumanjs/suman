'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var testErrors = _suman.testErrors = _suman.testErrors || [];
var errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
_suman.isActualExitHandlerRegistered = true;
if (!process.prependListener) {
    process.prependListener = process.on.bind(process);
}
if (!process.prependOnceListener) {
    process.prependOnceListener = process.on.bind(process);
}
process.prependOnceListener('exit', function (code) {
    var testDebugLogPath = _suman.testDebugLogPath;
    debugger;
    if (errors.length > 0) {
        code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
        errors.forEach(function (e) {
            var eStr = su.getCleanErrorString(e);
            _suman.usingRunner && process.stderr.write(eStr);
            _suman.writeTestError && _suman.writeTestError(eStr);
        });
    }
    else if (testErrors.length > 0) {
        code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
    }
    if (testDebugLogPath) {
    }
    _suman.writeTestError('\n\n ### Suman end run ### \n\n\n\n', { suppress: true });
    if (code > 0 && testErrors.length < 1) {
        if (!_suman.usingRunner) {
            console.log(chalk.underline.bold.yellow(' Suman test process experienced a fatal error during the run, ' +
                'most likely the majority of tests, if not all tests, were not run.') + '\n');
        }
    }
    if (_suman.checkTestErrorLog) {
        console.log(chalk.yellow(' You have some additional errors/warnings - check the test debug log for more information.'));
        console.log(' => ' + chalk.underline.bold.yellow(_suman.sumanHelperDirRoot + '/logs/test-debug.log'));
        console.log('\n');
    }
    if (Number.isInteger(_suman.expectedExitCode)) {
        if (code !== _suman.expectedExitCode) {
            var msg = "Expected exit code not met. Expected => " + _suman.expectedExitCode + ", actual => " + code;
            _suman.writeTestError(msg);
            _suman.log.error(msg);
            code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
        }
        else {
            console.log('\n');
            _suman.log.info(chalk.bgBlack.green(' Expected exit code was met. '));
            _suman.log.info(chalk.bgBlack.green(" Expected exit code was =>  '" + code + "'."));
            _suman.log.info(chalk.bgBlack.green(' Because the expected exit code was met, we will exit with code 0. '));
            code = 0;
        }
    }
    if (!_suman.usingRunner) {
        var extra = '';
        if (code > 0)
            extra = ' => see http://sumanjs.org/exit-codes.html';
        console.log('\n');
        var start = void 0;
        if (start = process.env['SUMAN_START_TIME']) {
            _suman.log.info('Absolute total time => ', (Date.now() - start));
        }
        if (code > 0) {
            _suman.log.info("Suman test is exiting with code " + code + "  " + extra);
        }
        else {
            _suman.log.info(chalk.bold("Suman test is exiting with code " + code + "  " + extra));
        }
        console.log('\n');
    }
    process.exitCode = code;
});
