'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
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
var injection_container_1 = require("./injection/injection-container");
var _a = require('./injection/$core-n-$deps'), $core = _a.$core, $deps = _a.$deps, mappedPkgJSONDeps = _a.mappedPkgJSONDeps;
var rules = require('./helpers/handle-varargs');
function default_1(suman) {
    return function (suite, parentSuite, depsObj) {
        return Object.keys(depsObj).map(function (key) {
            var dep = depsObj[key];
            if (dep) {
                return dep;
            }
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
                _suman.logError("Could not require() dependency with value => \"" + key + "\", will continue optimistically.");
                return undefined;
            }
        });
    };
}
exports.default = default_1;
;
