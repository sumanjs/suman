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
exports.makeTestCase = function (test, assertCount, handleError, fini) {
    var planCalled = false;
    var v = Object.create(t_proto_1.tProto);
    v.value = test.value;
    v.testId = test.testId;
    v.desc = v.title = test.desc;
    v.data = test.data;
    v.__test = test;
    v.__handle = v.__handleError = handleError;
    v.__fini = fini;
    var assrt = function () {
        try {
            return chaiAssert.apply(chaiAssert, arguments);
        }
        catch (e) {
            return handleError(e);
        }
    };
    v.assert = new Proxy(assrt, {
        get: function (target, prop) {
            if (typeof prop === 'symbol') {
                return Reflect.get.apply(Reflect, arguments);
            }
            if (!(prop in chaiAssert)) {
                try {
                    return Reflect.get.apply(Reflect, arguments);
                }
                catch (err) {
                    return handleError(new Error("The assertion library used does not have a '" + prop + "' property or method."));
                }
            }
            return function () {
                try {
                    return chaiAssert[prop].apply(chaiAssert, arguments);
                }
                catch (e) {
                    return handleError(e);
                }
            };
        }
    });
    v.plan = function (num) {
        if (planCalled) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called more than once for ' +
                'the same test case.').stack);
            return;
        }
        planCalled = true;
        if (test.planCountExpected !== undefined) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called, even though plan ' +
                'was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), 'Suman usage error => value passed to t.plan() is not an integer.');
        test.planCountExpected = v.planCountExpected = num;
    };
    v.confirm = function () {
        assertCount.num++;
    };
    return v;
};
