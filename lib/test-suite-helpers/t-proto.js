'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var freeze_existing_props_1 = require("freeze-existing-props");
var _suman = global.__suman = (global.__suman || {});
var $proto = Object.create(Function.prototype);
var proto = Object.create(Object.assign($proto, EE.prototype));
proto.skip = function () {
    throw new Error('Dynamic skip functionality is not supported by Suman, yet.');
};
proto.set = function (k, v) {
    return this.shared.set(k, v);
};
proto.get = function (k) {
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
proto.log = function () {
    _suman.writeLog.apply(null, arguments);
};
proto.slow = function () {
    this.timeout(30000);
};
exports.tProto = freeze_existing_props_1.freezeExistingProps(proto);
