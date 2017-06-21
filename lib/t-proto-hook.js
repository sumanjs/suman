'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var _suman = global.__suman = (global.__suman || {});
var proto = require('./t-proto');
exports.makeHookObj = function (hook, assertCount) {
    var planCalled = false;
    function H(handleError) {
        this.__handle = handleError;
    }
    H.prototype = Object.create(proto);
    H.prototype.plan = function _plan(num) {
        if (!planCalled) {
            planCalled = true;
            if (hook.planCountExpected !== undefined) {
                _suman._writeTestError(new Error(' => Suman warning => t.plan() called, even though plan was already passed as an option.').stack);
            }
            assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
            hook.planCountExpected = num;
        }
        else {
            _suman._writeTestError(new Error(' => Suman warning => t.plan() called twice.').stack);
        }
    };
    H.prototype.confirm = function _confirm() {
        assertCount.num++;
    };
    return H;
};
