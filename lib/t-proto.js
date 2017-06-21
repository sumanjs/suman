'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var EE = require('events');
var _suman = global.__suman = (global.__suman || {});
var freezeExistingProps = require('./freeze-existing');
var $proto = Object.create(Function.prototype);
var proto = Object.create(Object.assign($proto, EE.prototype));
proto.wrap = function _wrap(fn) {
    var self = this;
    return function () {
        try {
            fn.apply(this, arguments);
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
proto.log = function _log() {
    _suman._writeLog.apply(null, arguments);
};
proto.slow = function _slow() {
    debugger;
    this.timeout = 40000;
    console.log(util.inspect(this));
};
module.exports = freezeExistingProps(proto);
