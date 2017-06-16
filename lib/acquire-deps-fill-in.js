'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var pragmatik = require('pragmatik');
var colors = require('colors/safe');
var path = require('path');
var su = require('suman-utils');
var includes = require('lodash.includes');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants').constants;
var _a = require('./injection/$core-n-$deps'), $core = _a.$core, $deps = _a.$deps, mappedPkgJSONDeps = _a.mappedPkgJSONDeps;
var rules = require('./helpers/handle-varargs');
var container = {
    before: function () {
        return _suman.ctx.before.apply(_suman.ctx, arguments);
    },
    after: function () {
        return _suman.ctx.after.apply(_suman.ctx, arguments);
    },
    beforeEach: function () {
        return _suman.ctx.beforeEach.apply(_suman.ctx, arguments);
    },
    afterEach: function () {
        return _suman.ctx.afterEach.apply(_suman.ctx, arguments);
    },
    describe: function (desc, opts, arr, fn) {
        return _suman.ctx.describe.apply(_suman.ctx, arguments);
    },
    it: function () {
        return _suman.ctx.it.apply(_suman.ctx, arguments);
    },
    inject: function () {
        return _suman.ctx.inject.apply(_suman.ctx, arguments);
    },
};
container.describe.delay =
    function (desc, opts, arr, fn) {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].delay = true;
        args[1].__preParsed = true;
        container.describe.apply(this, args);
    };
container.describe.skip =
    function (desc, opts, arr, fn) {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        container.describe.apply(this, args);
    };
container.describe.only =
    function (desc, opts, arr, fn) {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].only = true;
        args[1].__preParsed = true;
        container.describe.apply(this, args);
    };
container.describe.skip.delay = container.describe.delay.skip = container.describe.skip;
container.describe.only.delay = container.describe.delay.only =
    function (desc, opts, arr, fn) {
        var args = pragmatik.parse(arguments, rules.blockSignature);
        args[1].only = true;
        args[1].__preParsed = true;
        container.describe.apply(this, args);
    };
container.it.skip =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.testCaseSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.it.apply(this, args);
    };
container.it.only =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.testCaseSignature);
        args[1].only = true;
        args[1].__preParsed = true;
        return container.it.apply(this, args);
    };
container.it.only.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.testCaseSignature);
        args[1].only = true;
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.it.apply(this, args);
    };
container.it.skip.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.testCaseSignature);
        args[1].skip = true;
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.it.apply(this, args);
    };
container.it.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.testCaseSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.it.apply(this, args);
    };
container.it.cb.skip = container.it.skip.cb;
container.it.cb.only = container.it.only.cb;
container.inject.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.inject.apply(this, args);
    };
container.inject.skip =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.inject.apply(this, args);
    };
container.inject.skip.cb = container.inject.cb.skip = container.inject.skip;
container.before.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.before.apply(this, args);
    };
container.before.skip =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.before.apply(this, args);
    };
container.before.skip.cb = container.before.cb.skip = container.before.skip;
container.after.skip =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].skip = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.last =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.always =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.cb.always =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.cb.last =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.last.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].cb = true;
        args[1].last = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.last.always =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.always.cb =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].always = true;
        args[1].cb = true;
        args[1].__preParsed = true;
        return container.after.apply(container, args);
    };
container.after.always.last =
    function (desc, opts, fn) {
        var args = pragmatik.parse(arguments, rules.hookSignature);
        args[1].last = true;
        args[1].always = true;
        args[1].__preParsed = true;
        return container.after.apply(this, args);
    };
container.after.cb.last.always =
    container.after.cb.always.last =
        container.after.last.cb.always =
            container.after.last.always.cb =
                container.after.always.cb.last =
                    container.after.always.last.cb =
                        function (desc, opts, fn) {
                            var args = pragmatik.parse(arguments, rules.hookSignature);
                            args[1].last = true;
                            args[1].always = true;
                            args[1].cb = true;
                            args[1].__preParsed = true;
                            return container.after.apply(this, args);
                        };
container.after.skip.cb =
    container.after.cb.skip =
        container.after.last.skip =
            container.after.skip.last =
                container.after.always.skip =
                    container.after.skip.always = container.after.skip;
container.after.skip.cb.last =
    container.after.skip.last.cb =
        container.after.skip.cb.always =
            container.after.skip.always.cb = container.after.skip;
container.after.skip.cb.last.always =
    container.after.skip.last.cb.always =
        container.after.skip.cb.always.last =
            container.after.skip.always.cb.last = container.after.skip;
container.beforeEach.cb = function (desc, opts, fn) {
    var args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.beforeEach.apply(this, args);
};
container.beforeEach.skip = function (desc, opts, fn) {
    var args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.beforeEach.apply(this, args);
};
container.beforeEach.skip.cb = container.beforeEach.cb.skip = container.beforeEach.skip;
container.afterEach.cb = function (desc, opts, fn) {
    var args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].cb = true;
    args[1].__preParsed = true;
    return container.afterEach.apply(this, args);
};
container.afterEach.skip = function (desc, opts, fn) {
    var args = pragmatik.parse(arguments, rules.hookSignature);
    args[1].skip = true;
    args[1].__preParsed = true;
    return container.afterEach.apply(this, args);
};
container.afterEach.skip.cb = container.afterEach.cb.skip = container.afterEach.skip;
module.exports = function (suman) {
    return function (suite, parentSuite, depsObj) {
        return Object.keys(depsObj).map(function (key) {
            var dep = depsObj[key];
            if (dep) {
                return dep;
            }
            if (includes(constants.SUMAN_HARD_LIST, key)) {
                switch (key) {
                    case 'suite':
                        return suite;
                    case '$pre':
                        return _suman['$pre'];
                    case '$deps':
                        return $deps;
                    case '$core':
                        return $core;
                    case '$root':
                        return _suman.projectRoot;
                    case 'resume':
                    case 'extraArgs':
                    case 'getResumeValue':
                    case 'getResumeVal':
                    case 'writable':
                    case 'inject':
                        return suite[key];
                    case 'describe':
                    case 'before':
                    case 'after':
                    case 'beforeEach':
                    case 'afterEach':
                    case 'it':
                        assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
                        return container[key];
                    case 'test':
                    case 'setup':
                    case 'teardown':
                    case 'setupTest':
                    case 'teardownTest':
                        assert(suite.interface === 'TDD', ' => Suman usage error, using the wrong interface.');
                        return suite[key];
                    case 'userData':
                        return _suman.userData;
                    default:
                        var e = new Error(' => Suman not implemented - the following key is not injectable => "' + key + '"');
                        if (_suman.inBrowser) {
                            console.error(e);
                        }
                        throw e;
                }
            }
            if (suite.isRootSuite && mappedPkgJSONDeps.indexOf(key) > -1) {
                return $deps[key];
            }
            if (parentSuite && (key in parentSuite.injectedValues)) {
                return parentSuite.injectedValues[key];
            }
            try {
                return require(key);
            }
            catch (err) {
                console.error(" => Could not require() dependency with value => \"" + key + "\", will continue optimistically.");
                return undefined;
            }
        });
    };
};
