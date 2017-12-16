'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var chai = require('chai');
var _suman = global.__suman = (global.__suman || {});
var fproto = Object.create(Function.prototype);
var proto = Object.create(Object.assign(fproto, EE.prototype));
proto.skip = function () {
    (this.__hook || this.__test).skipped = true;
    (this.__hook || this.__test).dynamicallySkipped = true;
};
proto.done = proto.pass = proto.ctn = proto.fail = function () {
    throw new Error('You have fired a callback for a test case or hook that was not callback oriented.');
};
proto.set = function (k, v) {
    if (arguments.length < 2) {
        throw new Error('Must pass both a key and value to "set" method.');
    }
    return this.__shared.set(k, v);
};
proto.get = function (k) {
    if (arguments.length < 1) {
        return this.__shared.getAll();
    }
    return this.__shared.get(k);
};
proto.gets = proto.getMany = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var self = this;
    return args.map(function (k) {
        return self.__shared.get(k);
    });
};
proto.wrap = function (fn) {
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
proto.wrapFinal = function (fn) {
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
proto.final = function (fn) {
    try {
        fn.apply(null, arguments);
        this.__fini(null);
    }
    catch (e) {
        this.__handle(e, false);
    }
};
var slice = Array.prototype.slice;
proto.wrapFinalErr = proto.wrapFinalErrFirst = proto.wrapFinalErrorFirst = proto.wrapFinalError = function (fn) {
    var self = this;
    return function (err) {
        if (err)
            return self.__handle(err, false);
        try {
            fn.apply(this, slice.call(arguments, 1));
            self.__fini(null);
        }
        catch (e) {
            self.__handle(e, false);
        }
    };
};
proto.wrapErrorFirst = proto.wrapErrFirst = function (fn) {
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
proto.handleAssertions = proto.wrapAssertions = function (fn) {
    try {
        fn.call(null);
    }
    catch (e) {
        this.__handleErr(e);
    }
};
proto.log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, [" [ '" + (this.desc || 'unknown') + "' ] "].concat(args));
};
proto.slow = function () {
    this.timeout(30000);
};
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
        return ctx.__handleError(e);
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
                return ctx.__handleError(new Error("The assertion library used does not have a '" + prop + "' property or method."));
            }
        }
        return function () {
            try {
                return chai.expect[prop].apply(chai.expect, arguments);
            }
            catch (e) {
                return ctx.__handleError(e);
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
        return ctx.__handleError(e);
    }
};
var p = new Proxy(assrt, {
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
                return ctx.__handleError(new Error("The assertion library used does not have a '" + prop + "' property or method."));
            }
        }
        return function () {
            try {
                return chai.assert[prop].apply(chai.assert, arguments);
            }
            catch (e) {
                return ctx.__handleError(e);
            }
        };
    }
});
Object.defineProperty(proto, 'assert', {
    get: function () {
        assertCtx.val = this;
        return p;
    }
});
exports.tProto = proto;
