'use strict';

//core
const assert = require('assert');

//npm
const colors = require('colors/safe');
const path = require('path');
const sumanUtils = require('suman-utils/utils');
const includes = require('lodash.includes');

//project
const constants = require('../config/suman-constants');
const cwd = process.cwd();
const projectRoot = global.projectRoot = (global.projectRoot || sumanUtils.findProjectRoot(cwd));


var pkgJSONDeps;
try {
  const pkgJSON = path.resolve(projectRoot + '/package.json');
  pkgJSONDeps = Object.keys((require(pkgJSON).dependencies || {}));
}
catch (err) {
  console.log('\n',(err.stack || err),'\n');
  pkgJSONDeps = [];
}

const mappedPkgJSONDeps = [];

const $deps = {};
// here we create container for all top-level dependencies in package.json
// we do *not* do this for devDependencies since they are contingent and not always installed
pkgJSONDeps.forEach(function (d) {
  const dashToLodash = String(d).replace('-','_');
  mappedPkgJSONDeps.push(dashToLodash);
  Object.defineProperty($deps, dashToLodash, {
    get: function () {
      return require(d);
    }
  });
});


const $core = {};
// $core contains potential reference to any core modules
constants.CORE_MODULE_LIST.forEach(function(c){
  Object.defineProperty($core, c, {
    get: function () {
      return require(c);
    }
  });
});


module.exports = function (suman) {

  return function (suite, parentSuite, depsObj, cb) {

    const deps = [];

    var err;

    try {

      Object.keys(depsObj).forEach(function (key, index) {

        const dep = depsObj[key];

        if (dep) {
          deps.push(dep);
        }
        else if (includes(constants.SUMAN_HARD_LIST, key)) {
          switch (key) {
            case 'suite':
              deps.push(suite);
              break;
            case '$deps':
              deps.push($deps);
              break;
            case '$core':
              deps.push($core);
              break;
            case 'resume':
            case 'extraArgs':
            case 'getResumeValue':
            case 'getResumeVal':
            case 'writable':
            case 'inject':
              deps.push(suite[key]);
              break;
            case 'describe':
            case 'before':
            case 'after':
            case 'beforeEach':
            case 'afterEach':
            case 'it':
              assert(suite.interface === 'BDD', ' => Suman usage error, using the wrong interface.');
              deps.push(suite[key]);
              break;
            case 'test':
            case 'setup':
            case 'teardown':
            case 'setupTest':
            case 'teardownTest':
              assert(suite.interface === 'TDD', ' => Suman usage error, using the wrong interface.');
              deps.push(suite[key]);
              break;
            case 'userData':
              deps.push(global.userData);
              break;
            default:
              throw new Error('Not implemented yet => "' + key + '"');
          }
        }
        else if(suite.isRootSuite && mappedPkgJSONDeps.indexOf(key) > -1){
            deps.push($deps[key]);
        }
        else if (parentSuite && (key in parentSuite.injectedValues)) {
          deps.push(parentSuite.injectedValues[key]);
        }
        else if (includes(constants.CORE_MODULE_LIST, key)) {
          deps.push(require(key))
        }
        else if (dep !== undefined) {
          console.error(' => Suman warning => value of dependency for key ="' + key + '" may be unexpected value => ', dep);
          deps.push(dep);
        }
        else {
          console.log(parentSuite && parentSuite.injectedValues);
          throw new Error(colors.red(' => Suman usage error => Dependency not met for: "' + key + '", dependency value is undefined =>' + dep));
        }

      });
    }
    catch ($err) {
      err = $err;
    }
    finally {
      process.nextTick(function () {
        cb(err, deps);
      });

    }

  };

};

