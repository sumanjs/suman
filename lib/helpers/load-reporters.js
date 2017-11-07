'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var assert = require("assert");
var EE = require("events");
var su = require("suman-utils");
var chalk = require("chalk");
var suman_events_1 = require("suman-events");
var _ = require("lodash");
var suman_constants_1 = require("../../config/suman-constants");
var _suman = global.__suman = (global.__suman || {});
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var reporterRets = _suman.reporterRets = (_suman.reporterRets || []);
var loaded = false;
exports.loadReporters = function (sumanOpts, projectRoot, sumanConfig) {
    if (loaded) {
        _suman.log.warning('Suman implementation warning, "load-reporters" routine called more than once.');
        return;
    }
    loaded = true;
    _suman.currentPaddingCount = _suman.currentPaddingCount || {};
    var optsCopy = JSON.parse(su.customStringify(sumanOpts));
    var onReporterLoadFail = function (err, item) {
        var msg = chalk.red('Could not load reporter with name => "' + item + '"');
        _suman.log.error(new Error(msg).stack + '\n\n' + err.stack);
        process.exit(suman_constants_1.constants.EXIT_CODES.COULD_NOT_LOAD_A_REPORTER);
    };
    var sr = _suman.sumanReporters = _.flattenDeep([sumanOpts.reporter_paths || []])
        .filter(function (v) {
        !v && _suman.log.warning('warning: a supposed filesystem path to a reporter was null or undefined.');
        return v;
    })
        .map(function (item) {
        if (!path.isAbsolute(item)) {
            item = path.resolve(projectRoot + '/' + item);
        }
        var fn;
        try {
            fn = require(item);
            fn = fn.default || fn;
            assert(typeof fn === 'function', ' (Supposed) reporter module does not export a function, at path = "' + item + '"');
            fn.pathToReporter = item;
        }
        catch (err) {
            throw new Error(chalk.red('Could not load reporter with name => "' + item + '"') + ("\n =>  " + (err.stack || err) + " \n"));
        }
        return fn;
    });
    if (sumanOpts.reporters && !su.isObject(sumanConfig.reporters)) {
        throw new Error('You provided reporter names but have no reporters object in your suman.conf.js file.');
    }
    var reporterKV;
    try {
        reporterKV = sumanConfig.reporters.map;
        assert(su.isObject(reporterKV), '{suman.conf.js}.reporters property must be an object.');
    }
    catch (err) {
        _suman.log.warning('could not load reporters map via suman.conf.js.');
        reporterKV = {};
    }
    _.flattenDeep([sumanOpts.reporters || []]).filter(function (v) {
        if (!v)
            _suman.log.warning('a reporter path was undefined.');
        return v;
    })
        .forEach(function (item) {
        var fn, val;
        if (item in reporterKV) {
            val = reporterKV[item];
            if (val && typeof val === 'string') {
                try {
                    fn = require(val);
                }
                catch (err) {
                    try {
                        fn = require(path.resolve(projectRoot + '/' + val));
                    }
                    catch (err) {
                        onReporterLoadFail(err, item);
                    }
                }
            }
            else if (val) {
                fn = val;
            }
            else {
                throw new Error('no reporter with name = "' + item + '" in your suman.conf.js file.');
            }
        }
        else {
            try {
                fn = require(item);
            }
            catch (err) {
                try {
                    var p = path.resolve('/suman-reporters/modules/' + item).substr(1);
                    fn = require(p);
                }
                catch (err) {
                    onReporterLoadFail(err, item);
                }
            }
        }
        try {
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'reporter module does not export a function, at path = "' + val + '"');
            fn.pathToReporter = item;
            sr.push(fn);
        }
        catch (err) {
            throw new Error(chalk.red('Could not load reporter with name => "' + item + '"') + ("\n => " + (err.stack || err) + "\n"));
        }
    });
    if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput) {
        _suman.log.info('TAP-JSON reporter loaded.');
        var fn = require('suman-reporters/modules/tap-json-reporter');
        fn = fn.default || fn;
        assert(typeof fn === 'function', 'Suman implementation error - reporter fail.');
        sr.push(fn);
    }
    else {
        _suman.log.info('TAP reporter *not* loaded on the first pass-through.');
    }
    if (sr.length < 1) {
        if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
            _suman.log.info('Using native/std reporter');
            rb.emit(String(suman_events_1.events.USING_STANDARD_REPORTER));
            var reporterPath = 'suman-reporters/modules/std-reporter';
            var fn = require(reporterPath);
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'Suman implementation error - reporter module format failure.');
            fn.pathToReporter = reporterPath;
            sr.push(fn);
        }
        else {
            _suman.log.info('TAP reporter loaded on second attempt.');
            var reporterPath = 'suman-reporters/modules/tap-json-reporter';
            var fn = require(reporterPath);
            fn = fn.default || fn;
            assert(typeof fn === 'function', 'Suman implementation error - reporter module format fail.');
            fn.pathToReporter = reporterPath;
            sr.push(fn);
        }
    }
    sr.forEach(function (reporter) {
        var fn = reporter.default || reporter;
        var reporterPath = fn.pathToReporter;
        reporterRets.push(fn.call(null, rb, optsCopy, {}));
        if (su.vgt(5)) {
            reporterPath && _suman.log.info("loaded reporter with path: \"" + reporterPath + "\"");
        }
    });
};
