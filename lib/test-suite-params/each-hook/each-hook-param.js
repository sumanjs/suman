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
var suman_constants_1 = require("../../../config/suman-constants");
var general_1 = require("../../helpers/general");
var badProps = {
    inspect: true,
    constructor: true
};
var EachHookParam = (function (_super) {
    __extends(EachHookParam, _super);
    function EachHookParam(hook, assertCount, handleError, fini, timerObj) {
        var _this = _super.call(this) || this;
        _this.__planCalled = false;
        _this.__hook = hook;
        _this.__handle = handleError;
        _this.__fini = fini;
        _this.__assertCount = assertCount;
        var v = _this.__timerObj = timerObj;
        var amount = _suman.weAreDebugging ? 5000000 : hook.timeout;
        var fn = _this.onTimeout.bind(_this);
        v.timer = setTimeout(fn, amount);
        return _this;
    }
    EachHookParam.prototype.onTimeout = function () {
        var v = this.__hook;
        v.timedOut = true;
        var err = general_1.cloneError(v.warningErr, suman_constants_1.constants.warnings.HOOK_TIMED_OUT_ERROR);
        err.isTimeout = true;
        this.__handle(err);
    };
    EachHookParam.prototype.ctn = function () {
        this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(undefined);
    };
    EachHookParam.prototype.pass = function () {
        this.callbackMode ? this.__fini(null) : this.handleNonCallbackMode(undefined);
    };
    EachHookParam.prototype.plan = function (num) {
        if (this.__planCalled) {
            _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
            return;
        }
        var hook = this.__hook;
        this.__planCalled = true;
        if (hook.planCountExpected !== undefined) {
            _suman.writeTestError(new Error(' => Suman warning => plan() called, even though plan was already passed as an option.').stack);
        }
        try {
            assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
        }
        catch (err) {
            return this.__handle(err);
        }
        hook.planCountExpected = this.planCountExpected = num;
    };
    EachHookParam.prototype.confirm = function () {
        this.__assertCount.num++;
    };
    return EachHookParam;
}(base_1.ParamBase));
exports.EachHookParam = EachHookParam;
