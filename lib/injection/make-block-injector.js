'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var pragmatik = require('pragmatik');
var includes = require('lodash.includes');
var _suman = global.__suman = (global.__suman || {});
var helpers_1 = require("./helpers");
exports.makeBlockInjector = function (suman, container) {
    return function (suite, parent, depsObj) {
        var sumanOpts = suman.opts;
        return Object.keys(depsObj).map(function (key) {
            var lowerCaseKey = String(key).toLowerCase();
            if (depsObj[key] && depsObj[key] !== '[suman reserved - no ioc match]') {
                return depsObj[key];
            }
            switch (lowerCaseKey) {
                case '$args':
                    return String(sumanOpts.user_args || '').split(/ +/).filter(function (i) { return i; });
                case '$argsraw':
                    return sumanOpts.user_args || '';
                case '$ioc':
                    return _suman.$staticIoc;
                case 'b':
                    return suite;
                case '$pre':
                    return _suman['$pre'];
                case '$deps':
                    return helpers_1.getCoreAndDeps().$deps;
                case '$core':
                    return helpers_1.getCoreAndDeps().$core;
                case '$root':
                case '$projectroot':
                    return _suman.projectRoot;
                case '$index':
                case '$project':
                case '$proj':
                    return helpers_1.getProjectModule();
                case 'resume':
                case 'getresumevalue':
                case 'getresumeval':
                case 'writable':
                    return suite[key];
                case 'describe':
                case 'context':
                case 'suite':
                case 'afterallparenthooks':
                case 'before':
                case 'after':
                case 'inject':
                case 'beforeall':
                case 'afterall':
                case 'beforeeach':
                case 'aftereach':
                case 'it':
                case 'test':
                case 'setup':
                case 'teardown':
                case 'setuptest':
                case 'teardowntest':
                    return container[lowerCaseKey];
                case 'userdata':
                    return _suman.userData;
            }
            if (parent) {
                var val = void 0;
                if (val = parent.getInjectedValue(key)) {
                    return val;
                }
            }
            return helpers_1.lastDitchRequire(key, '<block-injector>');
        });
    };
};
