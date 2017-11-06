'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var EE = require("events");
var async = require("async");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var constants = require('../config/suman-constants').constants;
var handle_suman_shutdown_1 = require("./helpers/handle-suman-shutdown");
exports.run = function (files) {
    var fileCount = chalk.bold.underline(String(files.length));
    var boldTitle = chalk.bold('single process mode');
    _suman.log.info(chalk.magenta("Suman will run the following " + fileCount + " files in " + boldTitle + ":"));
    files.forEach(function (f, index) {
        _suman.log.info("[" + (index + 1) + "]", chalk.gray(f[0]));
    });
    console.log();
    files.forEach(function (f) {
        require(f[0]);
    });
    var tsq = _suman.tsq, tsrq = _suman.tsrq, sumanOpts = _suman.sumanOpts;
    if (sumanOpts.dry_run) {
        _suman.log.warning('Suman is using the "--dry-run" argument, and is shutting down without actually running the tests.');
        return handle_suman_shutdown_1.shutdownProcess();
    }
    if (!_suman.sumanInitCalled) {
        throw new Error('Looks like none of your files contains a Suman test.');
    }
    tsq.drain = function () {
        if (tsrq.idle()) {
            _suman.log.verygood('We are done running all tests in single process mode.');
            handle_suman_shutdown_1.shutdownProcess();
        }
    };
    _suman.log.good('Resuming test registration for Suman single process mode.');
    tsrq.resume();
};
exports.run2 = function (files) {
    _suman.log.info(chalk.magenta('suman will run the following files in single process mode:'));
    _suman.log.info(util.inspect(files.map(function (v) { return v[0]; })));
    async.eachLimit(files, 5, function (f, cb) {
        var fullPath = f[0];
        var shortenedPath = f[1];
        console.log('\n');
        _suman.log.info('is now running test with filename => "' + shortenedPath + '"', '\n');
        suiteResultEmitter.once('suman-test-file-complete', function () {
            cb(null);
        });
        require(fullPath);
    }, function (err) {
        if (err) {
            console.error(err.stack || err || 'no error passed to error handler.');
            process.exit(1);
        }
        else {
            console.log('\n');
            _suman.log.info('SUMAN_SINGLE_PROCESS run is now complete.');
            console.log('\n');
            _suman.log.info('Time required for all tests in single process => ', Date.now() - _suman.sumanSingleProcessStartTime);
            process.exit(0);
        }
    });
};
