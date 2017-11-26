'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var assert = require("assert");
var EE = require("events");
var chalk = require("chalk");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var socketio_child_client_1 = require("../index-helpers/socketio-child-client");
var rb = _suman.resultBroadcaster = _suman.resultBroadcaster || new EE();
var sumanReporters = _suman.sumanReporters = _suman.sumanReporters || [];
var reporterRets = _suman.reporterRets = _suman.reporterRets || [];
var loaded = false;
var getReporterFn = function (fn) {
    return fn.default || fn.loadReporter || fn;
};
var loadReporter = function (rpath) {
    try {
        var fullPath = void 0;
        try {
            fullPath = require.resolve(rpath);
        }
        catch (err) {
            fullPath = require.resolve(path.resolve(_suman.projectRoot + '/' + rpath));
        }
        var fn_1 = require(fullPath);
        fn_1 = getReporterFn(fn_1);
        assert(typeof fn_1 === 'function', 'Suman implementation error - reporter module format fail.');
        fn_1.reporterPath = fullPath;
        return fn_1;
    }
    catch (err) {
        _suman.log.error("could not load reporter at path \"" + rpath + "\".");
        _suman.log.error(err.stack);
    }
};
exports.run = function () {
    if (loaded) {
        return;
    }
    else {
        loaded = true;
    }
    _suman.currentPaddingCount = _suman.currentPaddingCount || { val: 0 };
    var optsCopy = Object.assign({}, _suman.sumanOpts);
    var fn, client;
    if (sumanReporters.length < 1) {
        try {
            if (window) {
                if (window.__karma__) {
                    _suman.log.info('Attempting to load karma reporter.');
                    fn = loadReporter('suman-reporters/modules/karma-reporter');
                }
                else {
                    _suman.log.info('Attempting to load websocket reporter.');
                    fn = loadReporter('suman-reporters/modules/websocket-reporter');
                    client = socketio_child_client_1.getClient();
                }
            }
        }
        catch (err) {
            if (su.vgt(7)) {
                _suman.log.warning(chalk.yellow.bold(err.message));
            }
            if (_suman.inceptionLevel > 0 || _suman.sumanOpts.$useTAPOutput || _suman.usingRunner) {
                su.vgt(6) && _suman.log.info('last-ditch effort to load a reporter: loading "tap-json-reporter"');
                fn = loadReporter('suman-reporters/modules/tap-json-reporter');
            }
            else {
                su.vgt(6) && _suman.log.info('last-ditch effort to load a reporter: loading "std-reporter"');
                fn = loadReporter('suman-reporters/modules/std-reporter');
            }
        }
        assert(typeof fn === 'function', 'Suman implementation error - reporter fail - ' +
            'reporter does not export a function. Please report this problem.');
        sumanReporters.push(fn.reporterPath);
        reporterRets.push(fn.call(null, rb, optsCopy, {}, client));
    }
};
