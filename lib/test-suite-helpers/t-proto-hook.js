'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var chai = require('chai');
var chaiAssert = chai.assert;
var _suman = global.__suman = (global.__suman || {});
var t_proto_1 = require("./t-proto");
var badProps = {
    inspect: true,
    constructor: true
};
exports.makeHookObj = function (hook, assertCount, handleError, fini) {
    var planCalled = false;
    var v = Object.create(t_proto_1.tProto);
    v.__hook = hook;
    v.__handle = v.__handleErr = handleError;
    v.__fini = fini;
    v.plan = function (num) {
        if (planCalled) {
            _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
            return;
        }
        planCalled = true;
        if (hook.planCountExpected !== undefined) {
            _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
        hook.planCountExpected = v.planCountExpected = num;
    };
    v.confirm = function () {
        assertCount.num++;
    };
    return v;
};
