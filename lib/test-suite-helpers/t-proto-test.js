'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var chai = require('chai');
var chaiAssert = chai.assert;
var _suman = global.__suman = (global.__suman || {});
var t_proto_1 = require("./t-proto");
exports.makeTestCase = function (test, assertCount) {
    function T(handleError) {
        this.__handle = handleError;
        this.value = test.value;
        this.testId = test.testId;
        this.desc = this.title = test.desc;
        this.data = test.data;
        this.assert = function () {
            try {
                return chaiAssert.apply(this, arguments);
            }
            catch (e) {
                return this.__handle(e, false);
            }
        };
        var self = this;
        Object.keys(chaiAssert).forEach(function (key) {
            self.assert[key] = function () {
                try {
                    return chaiAssert[key].apply(chaiAssert, arguments);
                }
                catch (e) {
                    return self.__handle(e, false);
                }
            };
        });
    }
    T.prototype = Object.create(t_proto_1.tProto);
    var planCalled = false;
    T.prototype.plan = function (num) {
        if (!planCalled) {
            planCalled = true;
            if (test.planCountExpected !== undefined) {
                _suman.writeTestError(new Error(' => Suman warning => t.plan() called, even though plan ' +
                    'was already passed as an option.').stack);
            }
            assert(Number.isInteger(num), ' => Suman usage error => value passed to t.plan() is not an integer.');
            test.planCountExpected = num;
        }
        else {
            _suman.writeTestError(new Error(' => Suman warning => t.plan() called more than once for ' +
                'the same test case.').stack);
        }
    };
    T.prototype.confirm = function () {
        assertCount.num++;
    };
    return T;
};
