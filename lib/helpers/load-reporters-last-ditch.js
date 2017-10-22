'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var EE = require("events");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var sumanReporters = _suman.sumanReporters = (_suman.sumanReporters || []);
var loaded = false;
exports.run = function () {
    if (loaded) {
        return;
    }
    else {
        loaded = true;
    }
    _suman.currentPaddingCount = _suman.currentPaddingCount || {};
    var optsCopy = Object.assign({}, _suman.sumanOpts);
    if (sumanReporters.length < 1) {
        var fn = void 0;
        try {
            if (window) {
                fn = require('suman-reporters/modules/karma-reporter');
                fn = fn.default || fn;
            }
        }
        catch (err) {
            if (_suman.inceptionLevel > 0 || _suman.sumanOpts.$useTAPOutput || _suman.usingRunner) {
                _suman.log('last-ditch effort to load a reporter: loading tap-json reporter');
                fn = require('suman-reporters/modules/tap-json-reporter');
                fn = fn.default || fn;
            }
            else {
                _suman.log('last-ditch effort to load a reporter: loading std reporter');
                fn = require('suman-reporters/modules/std-reporter');
                fn = fn.default || fn;
            }
        }
        console.log('\n');
        console.error('\n');
        assert(typeof fn === 'function', 'Suman implementation error - reporter fail. Please report this problem on Github.');
        _suman.sumanReporters.push(fn);
        fn.call(null, resultBroadcaster, optsCopy, {}, su);
    }
};
