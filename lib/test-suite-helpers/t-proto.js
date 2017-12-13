'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var freeze_existing_props_1 = require("freeze-existing-props");
var chai = require('chai');
var chaiAssert = chai.assert;
var _suman = global.__suman = (global.__suman || {});
var fproto = Object.create(Function.prototype);
var proto = Object.create(Object.assign(fproto, EE.prototype));
proto.skip = function () {
    (this.__hook || this.__test).skipped = true;
    (this.__hook || this.__test).dynamicallySkipped = true;
};
proto.set = function (k, v) {
    if (arguments.length < 2) {
        throw new Error('Must pass both a key and value to "set" method.');
    }
    return this.shared.set(k, v);
};
proto.get = function (k) {
    if (arguments.length < 1) {
        return this.shared.getAll();
    }
    return this.shared.get(k);
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
proto.wrapFinal = proto.final = function (fn) {
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
proto.wrapFinalErr = proto.wrapFinalErrFirst = proto.finalErrFirst = proto.finalErrorFirst = function (fn) {
    var self = this;
    return function (err) {
        if (err) {
            return self.__handle(err, false);
        }
        try {
            fn.apply(this, Array.from(arguments).slice(1));
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
            return fn.apply(this, Array.from(arguments).slice(1));
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
var assrt = function () {
    try {
        return chaiAssert.apply(chaiAssert, arguments);
    }
    catch (e) {
        return assertCtx.val.__handleError(e);
    }
};
var p = new Proxy(assrt, {
    get: function (target, prop) {
        if (typeof prop === 'symbol') {
            return Reflect.get.apply(Reflect, arguments);
        }
        if (!(prop in chaiAssert)) {
            try {
                return Reflect.get.apply(Reflect, arguments);
            }
            catch (err) {
                return assertCtx.val.__handleError(new Error("The assertion library used does not have a '" + prop + "' property or method."));
            }
        }
        return function () {
            try {
                return chaiAssert[prop].apply(chaiAssert, arguments);
            }
            catch (e) {
                return assertCtx.val.__handleError(e);
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
exports.tProto = freeze_existing_props_1.freezeExistingProps(proto);
