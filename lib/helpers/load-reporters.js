'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var util = require("util");
var assert = require("assert");
var EE = require("events");
var su = require("suman-utils");
var chalk = require("chalk");
var suman_events_1 = require("suman-events");
var _ = require("lodash");
var suman_constants_1 = require("../../config/suman-constants");
var _suman = global.__suman = (global.__suman || {});
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var reporterRets = _suman.reporterRets = _suman.reporterRets || [];
var sr = _suman.sumanReporters = _suman.sumanReporters || [];
var loaded = false;
var getReporterFn = function (fn) {
    return fn.default || fn.loadReporter || fn;
};
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
    var sumanReporterFns = [];
    var loadReporterFn = function (fn, key) {
        try {
            fn = getReporterFn(fn);
            assert(typeof fn === 'function', ' (Supposed) reporter module does meet the API requirements => ' + util.inspect(fn));
            sumanReporterFns.push(fn);
            return true;
        }
        catch (err) {
            key && _suman.log.warning("Could not load reporter with key '" + key + "'.");
            _suman.log.warning(err.message);
        }
    };
    var loadReporterViaPath = function (rpath) {
        try {
            var fullPath = void 0;
            try {
                fullPath = require.resolve(rpath);
            }
            catch (err) {
                fullPath = require.resolve(path.resolve(projectRoot + '/' + rpath));
            }
            var fn_1 = require(fullPath);
            fn_1 = getReporterFn(fn_1);
            assert(typeof fn_1 === 'function', ' (Supposed) reporter module does not export a function, at path = "' + rpath + '"');
            fn_1.reporterPath = fullPath;
            sumanReporterFns.push(fn_1);
            return true;
        }
        catch (err) {
            _suman.log.error("could not load reporter at path \"" + rpath + "\".");
            _suman.log.error(err.stack);
        }
    };
    _.flattenDeep([sumanOpts.reporter_paths || []]).filter(function (v) {
        !v && _suman.log.warning('warning: a supposed filesystem path to a reporter was falsy.');
        return v;
    })
        .forEach(function (item) {
        if (!path.isAbsolute(item))
            (item = path.resolve(projectRoot + '/' + item));
        loadReporterViaPath(item);
    });
    if (sumanOpts.reporters && !su.isObject(sumanConfig.reporters)) {
        throw new Error('You provided reporter names but have no "reporters" object property in your <suman.conf.js> file.');
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
        !v && _suman.log.warning('a reporter path was falsy, it must be ignored.');
        return v;
    })
        .forEach(function (item) {
        var val;
        if (item in reporterKV) {
            val = reporterKV[item];
            if (val && typeof val === 'string') {
                loadReporterViaPath(val);
            }
            else if (val && typeof val === 'function') {
                loadReporterFn(val, item);
            }
            else {
                val = val ? ' The bad value is: ' + util.inspect(val) : '';
                _suman.log.warning("No acceptable value in reporters.map for key: '" + item + "'." + val);
            }
        }
        else {
            if (!loadReporterViaPath(item)) {
                var p = path.resolve('/suman-reporters/modules/' + item).substr(1);
                loadReporterViaPath(p);
            }
        }
    });
    if (process.env.SUMAN_INCEPTION_LEVEL > 0 || sumanOpts.$useTAPOutput || sumanOpts.$useTAPJSONOutput) {
        if (sumanOpts.$useTAPOutput) {
            _suman.log.info('TAP reporter loaded.');
            loadReporterViaPath('suman-reporters/modules/tap-reporter');
        }
        else {
            _suman.log.info('TAP-JSON reporter loaded.');
            loadReporterViaPath('suman-reporters/modules/tap-json-reporter');
        }
    }
    else {
        _suman.log.info('TAP / TAP-JSON reporter not loaded on the first pass-through.');
    }
    if (sumanReporterFns.length < 1) {
        if (process.env.SUMAN_INCEPTION_LEVEL < 1) {
            _suman.log.info('Using native/std reporter');
            rb.emit(String(suman_events_1.events.USING_STANDARD_REPORTER));
            loadReporterViaPath('suman-reporters/modules/std-reporter');
        }
        else {
            _suman.log.info('TAP reporter loaded on second attempt.');
            loadReporterViaPath('suman-reporters/modules/tap-json-reporter');
        }
    }
    sumanReporterFns.forEach(function (fn) {
        var reporterPath = fn.reporterPath;
        sr.push(reporterPath);
        reporterRets.push(fn.call(null, rb, optsCopy, {}));
        su.vgt(5) && reporterPath && _suman.log.info("Loaded reporter with path: \"" + reporterPath + "\"");
    });
};
