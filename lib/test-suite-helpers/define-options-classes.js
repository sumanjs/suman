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
var assert = require("assert");
var _ = require("lodash");
var su = require("suman-utils");
var DefineObject = (function () {
    function DefineObject(desc, exec) {
        this.exec = exec;
        this.opts = {
            '@DefineObjectOpts': true,
            __preParsed: false,
            desc: desc || '(unknown description/title/name)',
        };
    }
    DefineObject.prototype.inject = function () {
        return this;
    };
    DefineObject.prototype.plan = function (v) {
        assert(Number.isInteger(v), 'Argument to plan must be an integer.');
        this.opts.planCount = v;
        return this;
    };
    DefineObject.prototype.desc = function (v) {
        assert.equal(typeof v, 'string', 'Value for "desc" must be a string.');
        this.opts.desc = v;
        return this;
    };
    DefineObject.prototype.title = function (v) {
        assert.equal(typeof v, 'string', 'Value for "title" must be a string.');
        this.opts.desc = v;
        return this;
    };
    DefineObject.prototype.name = function (v) {
        assert.equal(typeof v, 'string', 'Value for "name" must be a string.');
        this.opts.desc = v;
        return this;
    };
    DefineObject.prototype.description = function (v) {
        assert.equal(typeof v, 'string', 'Value for "description" must be a string.');
        this.opts.desc = v;
        return this;
    };
    DefineObject.prototype.skip = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "skip" must be a boolean.');
        this.opts.skip = v;
        return this;
    };
    DefineObject.prototype.only = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "only" must be a boolean.');
        this.opts.only = v;
        return this;
    };
    DefineObject.prototype.parallel = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
        this.opts.parallel = v;
        return this;
    };
    DefineObject.prototype.series = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
        this.opts.series = v;
        return this;
    };
    DefineObject.prototype.mode = function (v) {
        assert.equal(typeof v, 'string', 'Value for "mode" must be a string.');
        this.opts.mode = v;
        return this;
    };
    DefineObject.prototype.timeout = function (v) {
        assert(Number.isInteger(v), 'Timeout value must be an integer.');
        this.opts.timeout = v;
        return this;
    };
    return DefineObject;
}());
exports.DefineObject = DefineObject;
var DefineObjectTestOrHook = (function (_super) {
    __extends(DefineObjectTestOrHook, _super);
    function DefineObjectTestOrHook() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefineObjectTestOrHook.prototype.throws = function (v) {
        if (typeof v === 'string') {
            v = new RegExp(v);
        }
        else if (!(v instanceof RegExp)) {
            throw new Error('Value for "throws" must be a String or regular expression (RegExp instance).');
        }
        this.opts.throws = v;
        return this;
    };
    DefineObjectTestOrHook.prototype.cb = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "cb" must be a boolean.');
        this.opts.cb = v;
        return this;
    };
    DefineObjectTestOrHook.prototype.events = function () {
        var successEvents = this.opts.successEvents = this.opts.successEvents || [];
        _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
            assert(v, 'Value was going to be added to "successEvents", but value is falsy');
            assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
            successEvents.push(v);
        });
        return this;
    };
    DefineObjectTestOrHook.prototype.successEvents = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var successEvents = this.opts.successEvents = this.opts.successEvents || [];
        _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
            assert(v, 'Value was going to be added to "successEvents", but value is falsy');
            assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
            successEvents.push(v);
        });
        return this;
    };
    DefineObjectTestOrHook.prototype.successEvent = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var successEvents = this.opts.successEvents = this.opts.successEvents || [];
        _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
            assert(v, 'Value was going to be added to "successEvents", but value is falsy');
            assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
            successEvents.push(v);
        });
        return this;
    };
    DefineObjectTestOrHook.prototype.errorEvents = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
        _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
            assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
            assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
            errorEvents.push(v);
        });
        return this;
    };
    DefineObjectTestOrHook.prototype.errorEvent = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
        _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
            assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
            assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
            errorEvents.push(v);
        });
        return this;
    };
    return DefineObjectTestOrHook;
}(DefineObject));
exports.DefineObjectTestOrHook = DefineObjectTestOrHook;
var DefineObjectAllHook = (function (_super) {
    __extends(DefineObjectAllHook, _super);
    function DefineObjectAllHook() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefineObjectAllHook.prototype.fatal = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
        this.opts.fatal = v;
        return this;
    };
    DefineObjectAllHook.prototype.first = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
        this.opts.first = v;
        return this;
    };
    DefineObjectAllHook.prototype.last = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "last" must be a boolean.');
        this.opts.last = v;
        return this;
    };
    DefineObjectAllHook.prototype.always = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "always" must be a boolean.');
        this.opts.always = v;
        return this;
    };
    DefineObjectAllHook.prototype.run = function (fn) {
        var name = this.opts.desc || '(unknown DefineObject name)';
        var opts = JSON.parse(su.customStringify(this.opts));
        this.exec.call(null, name, opts, fn);
        return this;
    };
    return DefineObjectAllHook;
}(DefineObjectTestOrHook));
exports.DefineObjectAllHook = DefineObjectAllHook;
var DefineObjectEachHook = (function (_super) {
    __extends(DefineObjectEachHook, _super);
    function DefineObjectEachHook() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefineObjectEachHook.prototype.fatal = function (v) {
        assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
        this.opts.fatal = v;
        return this;
    };
    DefineObjectEachHook.prototype.run = function (fn) {
        var name = this.opts.desc || '(unknown DefineObject name)';
        var opts = JSON.parse(su.customStringify(this.opts));
        this.exec.call(null, name, opts, fn);
        return this;
    };
    return DefineObjectEachHook;
}(DefineObjectTestOrHook));
exports.DefineObjectEachHook = DefineObjectEachHook;
var DefineObjectTestCase = (function (_super) {
    __extends(DefineObjectTestCase, _super);
    function DefineObjectTestCase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefineObjectTestCase.prototype.run = function (fn) {
        var name = this.opts.desc || '(unknown DefineObject name)';
        var opts = JSON.parse(su.customStringify(this.opts));
        this.exec.call(null, name, opts, fn);
        return this;
    };
    return DefineObjectTestCase;
}(DefineObjectTestOrHook));
exports.DefineObjectTestCase = DefineObjectTestCase;
var DefineObjectContext = (function (_super) {
    __extends(DefineObjectContext, _super);
    function DefineObjectContext() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DefineObjectContext.prototype.source = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.opts.sourced = this.opts.sourced || {};
        var self = this;
        Array.from(arguments).forEach(function (a) {
            if (Array.isArray(a)) {
                self.source.apply(self, a);
            }
            else if (typeof a === 'string') {
                self.opts.sourced[a] = true;
            }
            else {
                throw new Error('argument must be a string or an array of strings.');
            }
        });
        return this;
    };
    DefineObjectContext.prototype.names = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.opts.names = Array.from(arguments).reduce(function (a, b) {
            return a.concat(b);
        }, []);
        return this;
    };
    DefineObjectContext.prototype.run = function (fn) {
        var name = this.opts.desc || '(unknown DefineObject name)';
        var opts = JSON.parse(su.customStringify(this.opts));
        this.exec.call(null, name, opts, fn);
        return this;
    };
    return DefineObjectContext;
}(DefineObject));
exports.DefineObjectContext = DefineObjectContext;
