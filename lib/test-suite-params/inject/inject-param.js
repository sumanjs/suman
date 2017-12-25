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
var async = require("async");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var base_1 = require("../base");
var suman_constants_1 = require("../../../config/suman-constants");
var general_1 = require("../../helpers/general");
var badProps = {
    inspect: true,
    constructor: true
};
var InjectParam = (function (_super) {
    __extends(InjectParam, _super);
    function InjectParam(inject, assertCount, timerObj, suite, values, fini, handleError) {
        var _this = _super.call(this) || this;
        _this.__planCalled = false;
        _this.__valuesMap = {};
        _this.__suite = suite;
        _this.__hook = inject;
        _this.__handle = handleError;
        _this.__fini = fini;
        _this.__values = values;
        _this.__assertCount = assertCount;
        _this.__inject = inject;
        _this.planCountExpected = null;
        var v = _this.__timerObj = timerObj;
        var amount = _suman.weAreDebugging ? 5000000 : inject.timeout;
        var fn = _this.onTimeout.bind(_this);
        v.timer = setTimeout(fn, amount);
        return _this;
    }
    InjectParam.prototype.skip = function () {
        (this.__hook).skipped = true;
        (this.__hook).dynamicallySkipped = true;
    };
    InjectParam.prototype.onTimeout = function () {
        var v = this.__hook;
        v.timedOut = true;
        var err = general_1.cloneError(v.warningErr, suman_constants_1.constants.warnings.HOOK_TIMED_OUT_ERROR);
        err.isTimeout = true;
        this.__handle(err);
    };
    InjectParam.prototype.registerKey = function (k, val) {
        var suite = this.__suite;
        var valuesMap = this.__valuesMap;
        var values = this.__values;
        try {
            assert(k && typeof k === 'string', 'key must be a string.');
        }
        catch (err) {
            return this.__handle(err);
        }
        if (k in valuesMap) {
            return this.__handle(new Error("Injection key '" + k + "' has already been added."));
        }
        if (k in suite.injectedValues) {
            return this.__handle(new Error("Injection key '" + k + "' has already been added."));
        }
        valuesMap[k] = true;
        values.push({ k: k, val: val });
        return Promise.resolve(val);
    };
    InjectParam.prototype.registerFnMap = function (o) {
        var suite = this.__suite;
        var valuesMap = this.__valuesMap;
        var values = this.__values;
        var self = this;
        return new Promise(function (resolve, reject) {
            assert(su.isObject(o), 'value must be a non-array object.');
            async.series(o, function (err, results) {
                if (err) {
                    return reject(err);
                }
                try {
                    Object.keys(results).forEach(function (k) {
                        if (k in valuesMap) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                        if (k in suite.injectedValues) {
                            throw new Error("Injection key '" + k + "' has already been added.");
                        }
                        valuesMap[k] = true;
                        values.push({ k: k, val: results[k] });
                    });
                }
                catch (err) {
                    return reject(err);
                }
                resolve(results);
            });
        })
            .catch(function (err) {
            return self.__handle(err);
        });
    };
    InjectParam.prototype.registerMap = function (o) {
        var suite = this.__suite;
        var valuesMap = this.__valuesMap;
        var values = this.__values;
        var keys = Object.keys(o);
        var self = this;
        var registry;
        try {
            registry = keys.map(function (k) {
                if (k in valuesMap) {
                    throw new Error("Injection key '" + k + "' has already been added.");
                }
                if (k in suite.injectedValues) {
                    throw new Error("Injection key '" + k + "' has already been added.");
                }
                valuesMap[k] = true;
                values.push({ k: k, val: o[k] });
                return o[k];
            });
        }
        catch (err) {
            return self.__handle(err);
        }
        return Promise.all(registry)
            .catch(function (err) {
            return self.__handle(err);
        });
    };
    InjectParam.prototype.plan = function (num) {
        if (this.__planCalled) {
            _suman.writeTestError(new Error('Suman warning => plan() called more than once.').stack);
            return;
        }
        this.__planCalled = true;
        if (this.__inject.planCountExpected !== undefined) {
            _suman.writeTestError(new Error('Suman warning => plan() called, even though plan was already passed as an option.').stack);
        }
        try {
            assert(Number.isInteger(num), 'Suman usage error => value passed to plan() is not an integer.');
        }
        catch (err) {
            return this.__handle(err);
        }
        this.__inject.planCountExpected = this.planCountExpected = num;
    };
    InjectParam.prototype.confirm = function () {
        this.__assertCount.num++;
    };
    return InjectParam;
}(base_1.ParamBase));
exports.InjectParam = InjectParam;
var p = InjectParam.prototype;
p.register = p.registerKey;
p.registerPromisesMap = p.registerPromiseMap = p.registerMap;
p.registerFnsMap = p.registerFnMap;
