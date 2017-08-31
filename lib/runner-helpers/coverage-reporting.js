'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var cp = require("child_process");
var path = require("path");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.handleTestCoverageReporting = function (cb) {
    if (_suman.sumanOpts.coverage && !_suman.sumanOpts.no_report) {
        console.log('\n');
        _suman.log(chalk.blue.bold('Suman is running the Istanbul collated report.'));
        _suman.log(chalk.blue.bold('To disable automatic report generation, use "--no-coverage-report".'));
        var coverageDir = path.resolve(_suman.projectRoot + '/coverage');
        var k_1 = cp.spawn(_suman.istanbulExecPath, ['report', '--dir', coverageDir, '--include', '**/*coverage.json', 'lcov'], {
            cwd: _suman.projectRoot
        });
        k_1.stderr.pipe(process.stderr);
        k_1.once('close', function (code) {
            k_1.unref();
            cb(code ? new Error("Test coverage process exitted with non-zero exit code => \"" + code + "\".") : null, code);
        });
    }
    else {
        process.nextTick(cb);
    }
};
