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
var AllHookParam = (function (_super) {
    __extends(AllHookParam, _super);
    function AllHookParam(hook, assertCount, handleError, fini) {
        var _this = _super.call(this) || this;
        _this.planCountExpected = null;
        _this.__planCalled = false;
        _this.__hook = hook;
        _this.__handle = handleError;
        _this.__fini = fini;
        _this.__assertCount = assertCount;
        return _this;
    }
    AllHookParam.prototype.plan = function (num) {
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
    AllHookParam.prototype.confirm = function () {
        this.__assertCount.num++;
    };
    return AllHookParam;
}(base_1.ParamBase));
exports.AllHookParam = AllHookParam;
