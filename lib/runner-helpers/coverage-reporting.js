'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var path = require("path");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.handleTestCoverageReporting = function (cb) {
    if (!_suman.sumanOpts.coverage || _suman.sumanOpts.no_report) {
        return process.nextTick(cb);
    }
    console.log('\n');
    _suman.log.info(chalk.blue.bold('Suman is running the Istanbul collated report.'));
    _suman.log.info(chalk.blue.bold('To disable automatic report generation, use "--no-coverage-report".'));
    var coverageDir = path.resolve(_suman.projectRoot + '/coverage');
    var args = ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'];
    var k = cp.spawn(_suman.istanbulExecPath || 'istanbul', args, {
        cwd: _suman.projectRoot
    });
    k.stderr.pipe(process.stderr);
    k.once('close', function (code) {
        k.unref();
        cb(code ? new Error("Test coverage process exitted with non-zero exit code => \"" + code + "\".") : null, code);
    });
};
