'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var assert = require("assert");
var EE = require("events");
var suman_utils_1 = require("suman-utils");
var chalk = require("chalk");
var suman_events_1 = require("suman-events");
var _ = require("lodash");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
var loaded = false;
exports.loadReporters = function (sumanOpts, projectRoot, sumanConfig) {
    if (loaded) {
        return;
    }
    loaded = true;
    _suman.currentPaddingCount = _suman.currentPaddingCount || {};
    var optsCopy = Object.assign({}, sumanOpts);
    var sumanReporters = _suman.sumanReporters = _.flattenDeep([sumanOpts.reporter_paths || []])
        .filter(function (v) {
        if (!v) {
            _suman.logWarning('a reporter path was undefined.');
        }
        return v;
    }).map(function (item) {
        if (!path.isAbsolute(item)) {
            item = path.resolve(projectRoot + '/' + item);
        }
        var fn;
        try {
            fn = require(item);
            fn = fn.default || fn;
            _suman.log("loaded reporter with value \"" + item + "\"");
            assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
            fn.pathToReporter = item;
        }
        catch (err) {
            throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
                + '\n => ' + (err.stack || err) + '\n');
        }
        return fn;
    });
    if (sumanOpts.reporters && !suman_utils_1.default.isObject(sumanConfig.reporters)) {
        throw new Error('You provided reporter names but have no reporters object in your suman.conf.js file.');
    }
    var reporterKV = sumanConfig.reporters || {};
    assert(suman_utils_1.default.isObject(reporterKV), '{suman.conf.js}.reporters property must be an object.');
    _.flattenDeep([sumanOpts.reporters || []]).filter(function (v) {
        if (!v) {
            _suman.logWarning('a reporter path was undefined.');
        }
        return v;
    })
        .forEach(function (item) {
        var fn, val;
        if (!(item in reporterKV)) {
            try {
                fn = require(item);
                fn = fn.default || fn;
                _suman.log("loaded reporter with value \"" + item + "\"");
                assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + val + '"');
            }
            catch (err) {
                throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
                    + '\n => ' + (err.stack || err) + '\n');
            }
        }
        else {
            val = reporterKV[item];
            if (!val) {
                throw new Error('no reporter with name = "' + item + '" in your suman.conf.js file.');
            }
            else {
                if (typeof val === 'string') {
                    if (!path.isAbsolute(val)) {
                        val = path.resolve(projectRoot + '/' + val);
                    }
                    fn = require(val);
                }
                else {
                    fn = val;
                }
            }
        }
        try {
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'reporter module does not export a function, at path = "' + val + '"');
            fn.pathToReporter = val;
            sumanReporters.push(fn);
        }
        catch (err) {
            throw new Error(chalk.red('Could not load reporter with name => "' + item + '"')
                + '\n => ' + (err.stack || err) + '\n');
        }
    });
    if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput) {
        _suman.log('TAP-JSON reporter loaded.');
        var fn = require('suman-reporters/modules/tap-json-reporter');
        fn = fn.default || fn;
        assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
        sumanReporters.push(fn);
        reporterRets.push(fn.call(null, resultBroadcaster, optsCopy, {}, suman_utils_1.default));
    }
    else {
        _suman.log('TAP reporter *not* loaded on the first pass-through.');
    }
    if (sumanReporters.length < 1) {
        if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
            _suman.log('Using native/std reporter');
            resultBroadcaster.emit(String(suman_events_1.events.USING_STANDARD_REPORTER));
            var fn = require('suman-reporters/modules/std-reporter');
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
            sumanReporters.push(fn);
        }
        else {
            _suman.log('TAP reporter loaded on second attempt.');
            var fn = require('suman-reporters/modules/tap-json-reporter');
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
            sumanReporters.push(fn);
            reporterRets.push(fn.call(null, resultBroadcaster, optsCopy, {}, suman_utils_1.default));
        }
    }
    if (false) {
        try {
            sumanReporters.push(require('suman-sqlite-reporter'));
            resultBroadcaster.emit(String(suman_events_1.events.USING_SQLITE_REPORTER));
            _suman.log('sqlite reporter was loaded.');
        }
        catch (err) {
            _suman.logError('failed to load "suman-sqlite-reporter".');
        }
    }
    if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
        sumanReporters.forEach(function (reporter) {
            reporterRets.push((reporter.default || reporter).call(null, resultBroadcaster, optsCopy, {}, suman_utils_1.default));
        });
    }
};
