'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var make_start_suite_1 = require("./make-start-suite");
var makeRunChild = function (val) {
    return function runChild(child, cb) {
        child._run(val, cb);
    };
};
exports.TestBlockSymbols = {
    bindExtras: Symbol('bindExtras'),
    getInjections: Symbol('bindExtras'),
    children: Symbol('children'),
    tests: Symbol('tests'),
    parallelTests: Symbol('parallelTests'),
    befores: Symbol('befores'),
    beforeBlocks: Symbol('beforeBlocks'),
    beforesFirst: Symbol('beforesFirst'),
    beforesLast: Symbol('beforesLast'),
    beforeEaches: Symbol('beforeEaches'),
    afters: Symbol('afters'),
    afterBlocks: Symbol('afterBlocks'),
    aftersLast: Symbol('aftersLast'),
    aftersFirst: Symbol('aftersFirst'),
    afterEaches: Symbol('afterEaches'),
    injections: Symbol('injections'),
    getAfterAllParentHooks: Symbol('getAfterAllParentHooks'),
};
var id = 1;
var incr = function () {
    return id++;
};
var TestBlock = (function () {
    function TestBlock(obj) {
        var sumanOpts = _suman.sumanOpts;
        var suman = obj.suman, gracefulExit = obj.gracefulExit, handleBeforesAndAfters = obj.handleBeforesAndAfters, notifyParent = obj.notifyParent;
        this.__suitesuman = suman;
        this.__startSuite = make_start_suite_1.makeStartSuite(suman, gracefulExit, handleBeforesAndAfters, notifyParent);
        this.opts = obj.opts;
        this.testId = incr();
        this.isSetupComplete = false;
        var parallel = obj.opts.parallel;
        var mode = obj.opts.mode;
        var fixed = this.fixed = (this.opts.fixed || false);
        this.parallel = (sumanOpts.parallel && !fixed) || (!sumanOpts.series && (parallel === true || mode === 'parallel'));
        this.skipped = this.opts.skip || false;
        this.only = this.opts.only || false;
        this.filename = suman.filename;
        this.childCompletionCount = 0;
        this.completedChildrenMap = new Map();
        this.injectedValues = {};
        this.interface = suman.interface;
        this.desc = this.title = obj.desc;
        this[exports.TestBlockSymbols.children] = [];
        this[exports.TestBlockSymbols.tests] = [];
        this[exports.TestBlockSymbols.parallelTests] = [];
        this[exports.TestBlockSymbols.befores] = [];
        this[exports.TestBlockSymbols.beforeBlocks] = [];
        this[exports.TestBlockSymbols.beforesFirst] = [];
        this[exports.TestBlockSymbols.beforesLast] = [];
        this[exports.TestBlockSymbols.afters] = [];
        this[exports.TestBlockSymbols.afterBlocks] = [];
        this[exports.TestBlockSymbols.aftersFirst] = [];
        this[exports.TestBlockSymbols.aftersLast] = [];
        this[exports.TestBlockSymbols.beforeEaches] = [];
        this[exports.TestBlockSymbols.afterEaches] = [];
        this[exports.TestBlockSymbols.injections] = [];
        this[exports.TestBlockSymbols.getAfterAllParentHooks] = [];
    }
    TestBlock.prototype.getHooks = function () {
        return this.__suitesuman.containerProxy;
    };
    TestBlock.prototype.set = function (k, v) {
        if (arguments.length < 2) {
            throw new Error('Must pass both a key and value to "set" method.');
        }
        return this.shared.set(k, v);
    };
    TestBlock.prototype.get = function (k) {
        if (arguments.length < 1) {
            return this.shared.getAll();
        }
        return this.shared.get(k);
    };
    TestBlock.prototype.getValues = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        return args.map(function (k) {
            return self.shared.get(k);
        });
    };
    TestBlock.prototype.getMap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        var ret = {};
        args.forEach(function (k) {
            ret[k] = self.shared.get(k);
        });
        return ret;
    };
    TestBlock.prototype.getAfterAllParentHooks = function () {
        return this[exports.TestBlockSymbols.getAfterAllParentHooks];
    };
    TestBlock.prototype.mergeBefores = function () {
        while (this[exports.TestBlockSymbols.beforesFirst].length > 0) {
            this[exports.TestBlockSymbols.befores].unshift(this[exports.TestBlockSymbols.beforesFirst].pop());
        }
        while (this[exports.TestBlockSymbols.beforesLast].length > 0) {
            this[exports.TestBlockSymbols.befores].push(this[exports.TestBlockSymbols.beforesLast].shift());
        }
    };
    TestBlock.prototype.mergeAfters = function () {
        while (this[exports.TestBlockSymbols.aftersFirst].length > 0) {
            this[exports.TestBlockSymbols.afters].unshift(this[exports.TestBlockSymbols.aftersFirst].shift());
        }
        while (this[exports.TestBlockSymbols.aftersLast].length > 0) {
            this[exports.TestBlockSymbols.afters].push(this[exports.TestBlockSymbols.aftersLast].shift());
        }
    };
    TestBlock.prototype.getInjectedValue = function (key) {
        if (key in this.injectedValues) {
            return this.injectedValues[key];
        }
        else if (this.parent) {
            return this.parent.getInjectedValue(key);
        }
    };
    TestBlock.prototype.getInjectedValues = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        return args.map(function (a) {
            return self.getInjectedValue(a);
        });
    };
    TestBlock.prototype.getInjectedMap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        var ret = {};
        args.forEach(function (a) {
            ret[a] = self.getInjectedValue(a);
        });
        return ret;
    };
    TestBlock.prototype.getSourced = function () {
        var ret = {};
        var v = this;
        var _loop_1 = function () {
            var ioc = v.ioc;
            Object.keys(ioc).forEach(function (k) {
                if (!(k in ret)) {
                    ret[k] = ioc[k];
                }
            });
            v = this_1.parent;
        };
        var this_1 = this;
        while (v) {
            _loop_1();
        }
        return ret;
    };
    TestBlock.prototype.getSourcedValue = function (v) {
        if (v in this.ioc) {
            return this.ioc[v];
        }
        else if (this.parent) {
            return this.parent.getSourcedValue(v);
        }
    };
    TestBlock.prototype.getSourcedValues = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        return args.map(function (a) {
            return self.getSourcedValue(a);
        });
    };
    TestBlock.prototype.getSourcedMap = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var self = this;
        var ret = {};
        args.forEach(function (a) {
            ret[a] = self.getSourcedValue(a);
        });
        return ret;
    };
    TestBlock.prototype.getInjections = function () {
        return this[exports.TestBlockSymbols.injections];
    };
    TestBlock.prototype.getChildren = function () {
        return this[exports.TestBlockSymbols.children];
    };
    TestBlock.prototype.getTests = function () {
        return this[exports.TestBlockSymbols.tests];
    };
    TestBlock.prototype.getParallelTests = function () {
        return this[exports.TestBlockSymbols.parallelTests];
    };
    TestBlock.prototype.getBefores = function () {
        return this[exports.TestBlockSymbols.befores];
    };
    TestBlock.prototype.getBeforeBlocks = function () {
        return this[exports.TestBlockSymbols.beforeBlocks];
    };
    TestBlock.prototype.getBeforesFirst = function () {
        return this[exports.TestBlockSymbols.beforesFirst];
    };
    TestBlock.prototype.getBeforesLast = function () {
        return this[exports.TestBlockSymbols.beforesLast];
    };
    TestBlock.prototype.getBeforeEaches = function () {
        return this[exports.TestBlockSymbols.beforeEaches];
    };
    TestBlock.prototype.getAftersFirst = function () {
        return this[exports.TestBlockSymbols.aftersFirst];
    };
    TestBlock.prototype.getAftersLast = function () {
        return this[exports.TestBlockSymbols.aftersLast];
    };
    TestBlock.prototype.getAfters = function () {
        return this[exports.TestBlockSymbols.afters];
    };
    TestBlock.prototype.getAfterBlocks = function () {
        return this[exports.TestBlockSymbols.afterBlocks];
    };
    TestBlock.prototype.getAfterEaches = function () {
        return this[exports.TestBlockSymbols.afterEaches];
    };
    TestBlock.prototype.getAfterBlockList = function () {
        var v = this, ret = [];
        while (v = v.parent) {
            v.getAfterBlocks().reverse().forEach(function (z) {
                ret.unshift(z);
            });
        }
        return ret;
    };
    TestBlock.prototype.getBeforeBlockList = function () {
        var v = this, ret = [];
        while (v = v.parent) {
            v.getBeforeBlocks().reverse().forEach(function (z) {
                ret.unshift(z);
            });
        }
        return ret;
    };
    TestBlock.prototype.resume = function () {
        var args = Array.from(arguments);
        var self = this;
        process.nextTick(function () {
            self.__resume.apply(null, args);
        });
    };
    TestBlock.prototype.startSuite = function () {
        return this.__startSuite.apply(this, arguments);
    };
    TestBlock.prototype.toString = function () {
        return 'Suman test block: ' + this.desc;
    };
    TestBlock.prototype.invokeChildren = function (val, start) {
        async.eachSeries(this.getChildren(), makeRunChild(val), start);
    };
    TestBlock.prototype.bindExtras = function () {
        return this.__suitesuman.ctx = this;
    };
    return TestBlock;
}());
exports.TestBlock = TestBlock;
