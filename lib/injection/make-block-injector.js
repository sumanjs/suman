'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var pragmatik = require('pragmatik');
var includes = require('lodash.includes');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var injection_container_1 = require("./injection-container");
var _core_n__deps_1 = require("./$core-n-$deps");
var rules = require('../helpers/handle-varargs');
var helpers_1 = require("./helpers");
exports.makeBlockInjector = function (suman) {
    return function (suite, parentSuite, depsObj) {
        return Object.keys(depsObj).map(function (key) {
            if (depsObj[key] && depsObj[key] !== '[suman reserved - no ioc match]') {
                return depsObj[key];
            }
            switch (key) {
                case '$args':
                    return String(_suman.sumanOpts.user_args || '').split(/ +/).filter(function (i) { return i; });
                case '$argsRaw':
                    return _suman.sumanOpts.user_args || '';
                case '$ioc':
                    return _suman.$staticIoc;
                case '$block':
                    return suite;
                case '$pre':
                    return _suman['$pre'];
                case '$deps':
                    return _core_n__deps_1.getCoreAndDeps().$deps;
                case '$core':
                    return _core_n__deps_1.getCoreAndDeps().$core;
                case '$root':
                case '$projectRoot':
                    return _suman.projectRoot;
                case '$index':
                case '$project':
                    return helpers_1.getProjectModule();
                case 'resume':
                case 'extraArgs':
                case 'getResumeValue':
                case 'getResumeVal':
                case 'writable':
                case 'inject':
                    return suite[key];
                case 'describe':
                case 'context':
                case 'afterAllParentHooks':
                case 'before':
                case 'after':
                case 'beforeEach':
                case 'afterEach':
                case 'it':
                    assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
                    return injection_container_1.default[key];
                case 'test':
                case 'setup':
                case 'teardown':
                case 'setupTest':
                case 'teardownTest':
                    assert(suite.interface === 'TDD', ' => Suman usage error, using the wrong interface.');
                    return suite[key];
                case 'userData':
                    return _suman.userData;
            }
            if (parentSuite) {
                var val = void 0;
                if (val = parentSuite.getInjectedValue(key)) {
                    return val;
                }
            }
            try {
                return require(key);
            }
            catch (err) {
                _suman.logError("Could not require() dependency with value => \"" + key + "\", Suman will continue optimistically.");
                return undefined;
            }
        });
    };
};
