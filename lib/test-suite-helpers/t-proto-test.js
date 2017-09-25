'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var chai = require('chai');
var chaiAssert = chai.assert;
var _suman = global.__suman = (global.__suman || {});
var t_proto_1 = require("./t-proto");
exports.makeTestCase = function (test, assertCount, handleError) {
    var planCalled = false;
    var v = Object.create(t_proto_1.tProto);
    v.value = test.value;
    v.testId = test.testId;
    v.desc = v.title = test.desc;
    v.data = test.data;
    var assrt = function () {
        try {
            return chaiAssert.apply(null, arguments);
        }
        catch (e) {
            return handleError(e);
        }
    };
    v.assert = new Proxy(assrt, {
        get: function (target, prop) {
            return function () {
                try {
                    return chaiAssert[prop].apply(null, arguments);
                }
                catch (e) {
                    return handleError(e);
                }
            };
        }
    });
    v.plan = function (num) {
        if (planCalled) {
            _suman.writeTestError(new Error(' => Suman warning => t.plan() called more than once for ' +
                'the same test case.').stack);
            return;
        }
        planCalled = true;
        if (test.planCountExpected !== undefined) {
            _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan ' +
                'was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
        test.planCountExpected = v.planCountExpected = num;
    };
    v.confirm = function () {
        assertCount.num++;
    };
    return v;
};
