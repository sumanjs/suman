'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import su = require('suman-utils');
const camelcase = require('camelcase');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');

///////////////////////////////////////////////////////////////////

export interface ICoreAndDeps {
  $core: Object,
  $deps: Object,
  mappedPkgJSONDeps: Array<string>
}

let values : ICoreAndDeps = null;

///////////////////////////////////////////////////////////////////

export const getCoreAndDeps = function () {

  if (!values) {

    const cwd = process.cwd();
    const projectRoot = (_suman.projectRoot || su.findProjectRoot(cwd));
    const mappedPkgJSONDeps: Array<string> = [];
    const $deps = {};
    const $core = {};

    let pkgJSONDeps: Array<string>;
    try {
      const pkgJSON = path.resolve(projectRoot + '/package.json');
      const pkg = require(pkgJSON);
      pkgJSONDeps = Object.keys(pkg.dependencies || {});

      if (true) {  //TODO: allow a command line option to not import devDeps
        pkgJSONDeps = pkgJSONDeps.concat(Object.keys(pkg.devDependencies || {}));
        pkgJSONDeps = pkgJSONDeps.filter(function (item, i) {
          //get a unique list
          return pkgJSONDeps.indexOf(item) === i;
        });
      }
    }
    catch (err) {
      console.log('\n', (err.stack || err), '\n');
      pkgJSONDeps = [];
    }

// here we create container for all top-level dependencies in package.json
// we do *not* do this for devDependencies since they are contingent and not always installed

    pkgJSONDeps.forEach(function (d) {

      const dashToLodash = String(d).replace('-', '_');
      let camel = camelcase(d);
      mappedPkgJSONDeps.push(dashToLodash);

      try {
        Object.defineProperty($deps, dashToLodash, {
          get: function () {
            return require(d);
          }
        });

        if (camel !== dashToLodash) {
          camel = camel.charAt(0).toUpperCase() + camel.slice(1);
          mappedPkgJSONDeps.push(camel);
          Object.defineProperty($deps, camel, {
            get: function () {
              return require(d);
            }
          });
        }
      }
      catch (err) {
        _suman.logWarning('warning => ', err.message || err);
        console.error('\n');
      }

    });

// $core contains potential reference to any core modules
    constants.CORE_MODULE_LIST.forEach(function (c) {
      Object.defineProperty($core, c, {
        get: function () {
          return require(c);
        }
      });
    });

    values = {
      $core,
      $deps,
      mappedPkgJSONDeps
    }

  }

  return values;

};



