'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const assert = require('assert');

//npm
const colors = require('colors/safe');
const path = require('path');
const su = require('suman-utils');
const includes = require('lodash.includes');

//project
const _suman = global.__suman = (global.__suman || {});
const constants = require('../config/suman-constants');
const {$core, $deps, mappedPkgJSONDeps} = require('./injection/$core-n-$deps');

/*///////////////////////////////////////////////////////////////////

this module is responsible for +synchronously+ injecting values;
values may be procured +asynchronously+ prior to this, but here we
actually create the entire arguments array, all synchronously

//////////////////////////////////////////////////////////////////*/

module.exports = function (suman) {

  return function (suite, parentSuite, depsObj, cb) {

    debugger;

    return Object.keys(depsObj).map(key => {

      const dep = depsObj[key];

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
            let e = new Error(' => Suman not implemented - the following key is not injectable => "' + key + '"');
            if(_suman.inBrowser){
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

