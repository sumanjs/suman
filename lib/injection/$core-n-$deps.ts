'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

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
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');

///////////////////////////////////////////////////////////////////

export interface ICoreAndDeps {
  $core: Object,
  $deps: Object,
  mappedPkgJSONDeps: Array<string>
}

let values: ICoreAndDeps = null;

///////////////////////////////////////////////////////////////////

export const getCoreAndDeps = function () {

  if (!values) {

    const p = new Proxy({}, {
      get: function (target, prop) {

        const trimmed = String(prop).trim();

        try {
          return require(trimmed);
        }
        catch (err) { /* ignore */}

        const replaceLodashWithDash = trimmed.replace(/_/g, '-');
        if (replaceLodashWithDash !== trimmed) {
          try {
            return require(replaceLodashWithDash);
          }
          catch (err) { /* ignore */}

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



