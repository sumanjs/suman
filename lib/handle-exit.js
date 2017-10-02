'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var suman_utils_1 = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var testErrors = _suman.testErrors = _suman.testErrors || [];
var errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];
_suman.isActualExitHandlerRegistered = true;
if (!process.prependListener) {
    process.prependListener = process.on.bind(process);
}
process.prependListener('exit', function (code) {
    _suman.logError('beginning of final exit call...');
    if (errors.length > 0) {
        code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
        errors.forEach(function (e) {
            var eStr = suman_utils_1.default.getCleanErrorString(e);
            _suman.usingRunner && process.stderr.write(eStr);
            _suman.writeTestError && _suman.writeTestError(eStr);
        });
    }
    else if (testErrors.length > 0) {
        code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
    }
    if (_suman.writeTestError) {
        _suman.writeTestError('\n\n ### Suman end run ### \n\n\n\n', { suppress: true });
    }
    if (_suman._writeLog) {
        if (process.env.SUMAN_SINGLE_PROCESS === 'yes') {
            _suman._writeLog('\n\n\ [ end of Suman run in SUMAN_SINGLE_PROCESS mode ]');
        }
        else {
            _suman._writeLog('\n\n\ [ end of Suman individual test run for file => "' + _suman._currentModule + '" ]');
        }
    }
    if (code > 0 && testErrors.length < 1) {
        if (!_suman.usingRunner) {
            process.stdout.write('\n\n =>' + chalk.underline.bold.yellow(' Suman test process experienced a fatal error during the run, ' +
                'most likely the majority of tests, if not all tests, were not run.') + '\n');
        }
    }
    if (_suman.checkTestErrorLog) {
        process.stdout.write('\n\n =>' + chalk.yellow(' You have some additional errors/warnings - ' +
            'check the test debug log for more information.' + '\n'));
        process.stdout.write(' => ' + chalk.underline.bold.yellow(_suman.sumanHelperDirRoot + '/logs/test-debug.log'));
        process.stdout.write('\n\n');
    }
    if (Number.isInteger(_suman.expectedExitCode)) {
        if (code !== _suman.expectedExitCode) {
            var msg = "Expected exit code not met. Expected => " + _suman.expectedExitCode + ", actual => " + code;
            _suman.writeTestError(msg);
            _suman.logError(msg);
            code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
        }
        else {
            console.log('\n');
            _suman.log(chalk.bgBlack.green(' Expected exit code was met. '));
            _suman.log(chalk.bgBlack.green(" Expected exit code was =>  '" + code + "'."));
            _suman.log(chalk.bgBlack.green(' Because the expected exit code was met, we will exit with code 0. '));
            code = 0;
        }
    }
    if (!_suman.usingRunner) {
        var extra = '';
        if (code > 0) {
            extra = ' => see http://sumanjs.org/exit-codes.html';
        }
        console.log('\n');
        var start = void 0;
        if (start = process.env['SUMAN_START_TIME']) {
            _suman.log('Absolute total time => ', (Date.now() - start));
        }
        _suman.log('Suman test is exiting with code ' + code + ' ', extra);
        console.log('\n');
    }
    if (typeof _suman.absoluteLastHook === 'function') {
        _suman.logError('killing daemon process, using absolute last hook.');
        _suman.absoluteLastHook(code);
    }
    _suman.logError('making final call to process.exit()');
    process.exit(code);
});
