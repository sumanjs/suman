'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var chai = require('chai');
var chaiAssert = chai.assert;
var _suman = global.__suman = (global.__suman || {});
var base_1 = require("../base");
var badProps = {
    inspect: true,
    constructor: true
};
var TestCaseParam = (function (_super) {
    __extends(TestCaseParam, _super);
    function TestCaseParam(test, assertCount, handleError, fini) {
        var _this = _super.call(this) || this;
        _this.assertCount = assertCount;
        _this.planCalled = false;
        _this.value = test.value;
        _this.testId = test.testId;
        _this.desc = _this.title = test.desc;
        _this.data = test.data;
        _this.__test = test;
        _this.__handle = handleError;
        _this.__fini = fini;
        return _this;
    }
    TestCaseParam.prototype.plan = function (num) {
        var test = this.__test;
        if (this.planCalled) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called more than once for ' +
                'the same test case.').stack);
            return;
        }
        this.planCalled = true;
        if (test.planCountExpected !== undefined) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called, even though plan ' +
                'was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), 'Suman usage error => value passed to t.plan() is not an integer.');
        test.planCountExpected = this.planCountExpected = num;
    };
    TestCaseParam.prototype.confirm = function () {
        this.assertCount.num++;
    };
    return TestCaseParam;
}(base_1.ParamBase));
exports.TestCaseParam = TestCaseParam;
