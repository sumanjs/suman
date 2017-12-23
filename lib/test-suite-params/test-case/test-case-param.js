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
var _suman = global.__suman = (global.__suman || {});
var base_1 = require("../base");
var suman_constants_1 = require("../../../config/suman-constants");
var general_1 = require("../../helpers/general");
var TestCaseParam = (function (_super) {
    __extends(TestCaseParam, _super);
    function TestCaseParam(test, assertCount, handleError, fini, timerObj) {
        var _this = _super.call(this) || this;
        _this.__assertCount = assertCount;
        _this.__planCalled = false;
        _this.value = test.value;
        _this.testId = test.testId;
        _this.desc = _this.title = test.desc;
        _this.data = test.data;
        _this.__test = test;
        _this.__handle = handleError;
        _this.__fini = fini;
        var v = _this.__timerObj = timerObj;
        var amount = _suman.weAreDebugging ? 5000000 : test.timeout;
        v.timer = setTimeout(_this.onTimeout.bind(_this), amount);
        return _this;
    }
    TestCaseParam.prototype.onTimeout = function () {
        var v = this.__test;
        v.timedOut = true;
        var err = general_1.cloneError(v.warningErr, suman_constants_1.constants.warnings.TEST_CASE_TIMED_OUT_ERROR);
        err.isFromTest = true;
        err.isTimeout = true;
        this.__handle(err);
    };
    TestCaseParam.prototype.__inheritedSupply = function (target, prop, value, receiver) {
        this.__handle(new Error('cannot set any properties on t.supply (in test cases).'));
        return false;
    };
    TestCaseParam.prototype.pass = function () {
        this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(null);
    };
    TestCaseParam.prototype.ctn = function () {
        this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(null);
    };
    TestCaseParam.prototype.fail = function (err) {
        if (!this.callbackMode) {
            this.handleNonCallbackMode(err);
        }
        else {
            this.__handle(err || new Error('t.fail() was called on test (note that null/undefined value ' +
                'was passed as first arg to the fail function.)'));
        }
    };
    TestCaseParam.prototype.plan = function (num) {
        var test = this.__test;
        if (this.__planCalled) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called more than once for ' +
                'the same test case.').stack);
            return;
        }
        this.__planCalled = true;
        if (test.planCountExpected !== undefined) {
            _suman.writeTestError(new Error('Suman warning => t.plan() called, even though plan ' +
                'was already passed as an option.').stack);
        }
        assert(Number.isInteger(num), 'Suman usage error => value passed to t.plan() is not an integer.');
        test.planCountExpected = this.planCountExpected = num;
    };
    TestCaseParam.prototype.confirm = function () {
        this.__assertCount.num++;
    };
    return TestCaseParam;
}(base_1.ParamBase));
exports.TestCaseParam = TestCaseParam;
