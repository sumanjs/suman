'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');

///////////////////////////////////////////////////////////////////////

export interface ICoreAndDeps {
  $core: Object,
  $deps: Object,
  mappedPkgJSONDeps: Array<string>
}

let values = null;

///////////////////////////////////////////////////////////////////

export const getCoreAndDeps = function () : typeof values {

  if (!values) {

    const p = new Proxy({}, {
      get: function (target, prop) {

        const trimmed = String(prop).trim();

        try {
          return require(trimmed);
        }
        catch (err) {
          /* ignore */
        }

        const replaceLodashWithDash = trimmed.replace(/_/g, '-');
        if (replaceLodashWithDash !== trimmed) {
          try {
            return require(replaceLodashWithDash);
          }
          catch (err) {
            _suman.log.error(err);
          }

          throw new Error(`could not require dependencies with names '${trimmed}' or '${replaceLodashWithDash}'.`)
        }

        throw new Error(`could not require dependency with name '${trimmed}'`);
      }
    });

    values = {
      $core: p,
      $deps: p,
      $require: p
    }

  }

  return values;

};

export const getProjectModule = function (): any {

  try {
    return require(_suman.projectRoot);
  }
  catch (err) {
    _suman.log.error('\n', err.stack || err, '\n');
    return null;
  }

};

export const lastDitchRequire = function (dep: string, requestorName: string): any {

  requestorName = requestorName || '';

  try {
    return require(dep);
  }
  catch (err) {
    try {
      //retry, replacing characters
      return require(String(dep).replace(/_/g, '-'));
    }
    catch (err) {
      _suman.log.error(`'${requestorName}' warning => cannot require dependency with name => '${dep}'.`);
      _suman.log.error('Despite the missing dependency, Suman will continue optimistically.');
      console.error('\n');
      return null;
    }
  }

};
