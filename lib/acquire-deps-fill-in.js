'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var colors = require('colors/safe');
var path = require('path');
var su = require('suman-utils');
var includes = require('lodash.includes');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../config/suman-constants');
var _a = require('./injection/$core-n-$deps'), $core = _a.$core, $deps = _a.$deps, mappedPkgJSONDeps = _a.mappedPkgJSONDeps;
module.exports = function (suman) {
    return function (suite, parentSuite, depsObj) {
        return Object.keys(depsObj).map(function (key) {
            var dep = depsObj[key];
            if (dep) {
                return dep;
            }
            else if (includes(constants.SUMAN_HARD_LIST, key)) {
                switch (key) {
                    case 'suite':
                        return suite;
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
                        return suite[key];
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
            else if (suite.isRootSuite && mappedPkgJSONDeps.indexOf(key) > -1) {
                return $deps[key];
            }
            else if (parentSuite && (key in parentSuite.injectedValues)) {
                return parentSuite.injectedValues[key];
            }
            else if (includes(constants.CORE_MODULE_LIST, key)) {
                return require(key);
            }
            else if (dep !== undefined) {
                console.error(' => Suman warning => value of dependency for key ="' + key + '" may be unexpected value => ', dep);
                return dep;
            }
            else {
                throw new Error(colors.red(' => Suman usage error => Dependency for the following key is undefined: "' + key + '"'));
            }
        });
    };
};
