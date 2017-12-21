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
var EE = require("events");
var util = require("util");
var su = require("suman-utils");
var chai = require('chai');
var _suman = global.__suman = (global.__suman || {});
var badProps = {
    inspect: true,
    constructor: true
};
var slice = Array.prototype.slice;
var ParamBase = (function (_super) {
    __extends(ParamBase, _super);
    function ParamBase() {
        return _super.call(this) || this;
    }
    ParamBase.prototype.done = function () {
        this.__handle(new Error('You have fired a callback for a test case or hook that was not callback oriented.'));
    };
    ParamBase.prototype.skip = function () {
        (this.__hook || this.__test).skipped = true;
        (this.__hook || this.__test).dynamicallySkipped = true;
    };
    ParamBase.prototype.fatal = function (err) {
        if (!err) {
            err = new Error('t.fatal() was called by the developer, with a falsy first argument.');
        }
        else if (!su.isObject(err)) {
            var msg = 't.fatal() was called by the developer: ';
            err = new Error(msg + util.inspect(err));
        }
        err.sumanFatal = true;
        this.__handle(err);
    };
    ParamBase.prototype.set = function (k, v) {
        if (arguments.length < 2) {
            throw new Error('Must pass both a key and value to "set" method.');
        }
        return this.__shared.set(k, v);
    };
    ParamBase.prototype.get = function (k) {
        if (arguments.length < 1) {
            return this.__shared.getAll();
        }
        return this.__shared.get(k);
    };
    ParamBase.prototype.getValues = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        return args.map(function (k) {
            return self.__shared.get(k);
        });
    };
    ParamBase.prototype.getMap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        var ret = {};
        args.forEach(function (a) {
            ret[a] = self.__shared.get(a);
        });
        return ret;
    };
    ParamBase.prototype.wrap = function (fn) {
        var self = this;
        return function () {
            try {
                return fn.apply(this, arguments);
            }
            catch (e) {
                return self.__handle(e, false);
            }
        };
    };
    ;
    ParamBase.prototype.wrapFinal = function (fn) {
        var self = this;
        return function () {
            try {
                fn.apply(this, arguments);
                self.__fini(null);
            }
            catch (e) {
                self.__handle(e, false);
            }
        };
    };
    ParamBase.prototype.final = function (fn) {
        try {
            fn.apply(null, arguments);
            this.__fini(null);
        }
        catch (e) {
            this.__handle(e, false);
        }
    };
    ParamBase.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.log.apply(console, [" [ '" + (this.desc || 'unknown') + "' ] "].concat(args));
    };
    ParamBase.prototype.slow = function () {
        this.timeout(30000);
    };
    ParamBase.prototype.wrapFinalErrorFirst = function (fn) {
        var self = this;
        return function (err) {
            if (err) {
                return self.__handle(err, false);
            }
            try {
                fn.apply(this, slice.call(arguments, 1));
                self.__fini(null);
            }
            catch (e) {
                self.__handle(e, false);
            }
        };
    };
    ParamBase.prototype.wrapErrorFirst = function (fn) {
        var self = this;
        return function (err) {
            if (err) {
                return self.__handle(err, false);
            }
            try {
                return fn.apply(this, slice.call(arguments, 1));
            }
            catch (e) {
                return self.__handle(e, false);
            }
        };
    };
    ParamBase.prototype.handleAssertions = function (fn) {
        try {
            return fn.call(null);
        }
        catch (e) {
            return this.__handle(e);
        }
    };
    ;
    return ParamBase;
}(EE));
exports.ParamBase = ParamBase;
var b = Object.setPrototypeOf(ParamBase.prototype, Function.prototype);
var proto = Object.assign(ParamBase.prototype, EE.prototype);
proto.pass = proto.ctn = proto.fail = proto.done;
proto.wrapFinalErrFirst = proto.wrapFinalErr = proto.wrapFinalError = proto.wrapFinalErrorFirst;
proto.wrapErrFirst = proto.wrapErrorFirst;
var assertCtx = {
    val: null
};
var expectCtx = {
    val: null
};
var expct = function () {
    var ctx = expectCtx.val;
    if (!ctx) {
        throw new Error('Suman implementation error => expect context is not defined.');
    }
    try {
        return chai.expect.apply(chai.expect, arguments);
    }
    catch (e) {
        return ctx.__handle(e);
    }
};
var expectProxy = new Proxy(expct, {
    get: function (target, prop) {
        if (typeof prop === 'symbol') {
            return Reflect.get.apply(Reflect, arguments);
        }
        var ctx = expectCtx.val;
        if (!ctx) {
            throw new Error('Suman implementation error => assert context is not defined.');
        }
        if (!(prop in chai.expect)) {
            try {
                return Reflect.get.apply(Reflect, arguments);
            }
            catch (err) {
                return ctx.__handle(new Error("The assertion library used does not have a '" + prop + "' property or method."));
            }
        }
        return function () {
            try {
                return chai.expect[prop].apply(chai.expect, arguments);
            }
            catch (e) {
                return ctx.__handle(e);
            }
        };
    }
});
Object.defineProperty(proto, 'expect', {
    get: function () {
        expectCtx.val = this;
        return expectProxy;
    }
});
var assrt = function () {
    var ctx = assertCtx.val;
    if (!ctx) {
        throw new Error('Suman implementation error => assert context is not defined.');
    }
    try {
        return chai.assert.apply(chai.assert, arguments);
    }
    catch (e) {
        return ctx.__handle(e);
    }
};
var assertProxy = new Proxy(assrt, {
    get: function (target, prop) {
        if (typeof prop === 'symbol') {
            return Reflect.get.apply(Reflect, arguments);
        }
        var ctx = assertCtx.val;
        if (!ctx) {
            throw new Error('Suman implementation error => assert context is not defined.');
        }
        if (!(prop in chai.assert)) {
            try {
                return Reflect.get.apply(Reflect, arguments);
            }
            catch (err) {
                return ctx.__handle(new Error("The assertion library used does not have a '" + prop + "' property or method."));
            }
        }
        return function () {
            try {
                return chai.assert[prop].apply(chai.assert, arguments);
            }
            catch (e) {
                return ctx.__handle(e);
            }
        };
    }
});
Object.defineProperty(proto, 'assert', {
    get: function () {
        assertCtx.val = this;
        return assertProxy;
    }
});
