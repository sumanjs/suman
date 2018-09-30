'use strict';

//dts
import Timer = NodeJS.Timer;
import {IDepContainer} from "suman-types/dts/integrant-value-container";
import {IGlobalSumanObj, ISumanGlobal} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');

//npm
import _ = require('lodash');
const fnArgs = require('function-arguments');
import * as su from 'suman-utils';
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {asyncHelper, extractVals} from '../helpers/general';

////////////////////////////////////////////////////////////////////

interface ICachedProm {
  [key: string]: Promise<any>
}

export interface IOncePostHash {
  [key: string]: any
}

interface IAccum {
  [key: string]: any
}

///////////////////////////////////////////////////////////////

// use Map instead? Map<string, Promise<any>> = new Map();
let cachedPromises: ICachedProm = {};

///////////////////////////////////////////////////////////////

export const acquirePreDeps = function ($depList: Array<string> | Array<Array<string>>, depContainerObj: IDepContainer,
                                        oncePostHash: IOncePostHash): Promise<any> {
  
  const depList = su.flattenDeep([$depList]);
  const verbosity = _suman.sumanOpts.verbosity || 5;
  
  const getAllPromises = function (key: string, $deps: Array<any>): Promise<any> {
    
    if (cachedPromises[key]) {
      return cachedPromises[key];
    }
    
    if (verbosity > 3) {
      // only want to log this once, that's why we check cachedPromises for the key
      _suman.log.info(chalk.cyan(`(suman.once.pre.js) => Beginning to source dep with key => '${key}'`));
    }
    
    const val = depContainerObj[key];
    let {subDeps, fn, timeout, props} = extractVals(val);
    
    // in case the user sets it to some weird falsey value
    if (!timeout || !Number.isInteger(timeout)) {
      timeout = 25000; // 15 seconds
    }
    
    if (verbosity > 6) {
      _suman.log.info(`Maximum time allocated to source dependency with key => '${key}' is => `, timeout);
    }
    
    $deps.forEach(function (d) {
      if (d === key) {
        throw new Error('Circular dependency => existing deps => ' + util.inspect($deps) + ', ' +
          'new dep => "' + key + '"');
      }
    });
    
    // don't ask me why we push this key here,
    // but it's probably very important to do it
    // most likely to detect circular dependencies
    $deps.push(key);
    
    subDeps.forEach(function (d) {
      // here we attempt to catch circular dependencies earlier
      if ($deps.includes(d)) {
        throw new Error(' => Direct circular dependency => pre-existing deps => ' + util.inspect($deps) + ', ' +
          'newly required dep => "' + d + '"');
      }
    });
    
    const acc: IAccum = {}; // accumulated value
    
    return cachedPromises[key] = Promise.all(
      subDeps.map(function (k) {
        return getAllPromises(k, $deps.slice(0)).then(function (v) {
          Object.assign(acc, v);
        });
      })
    ).then(function ($$vals) {
      
      // ignore $$vals
      // the reason we throw out $$vals is these represent results for all the subdependencies of key = x
      // we just want to store the actual val for key = x, for each key x
      
      if (verbosity > 5 && subDeps.length > 0) {
        _suman.log.info(chalk.blue(`suman.once.pre.js => `
          + `Finished sourcing the dependencies ${util.inspect(subDeps)} of key => '${key}'`));
      }
      
      let to: Timer;
      
      return new Promise(function (resolve, reject) {
        
        to = setTimeout(function () {
          reject(new Error(`Suman dependency acquisition timed-out for dependency with key => '${key}'`));
        }, _suman.weAreDebugging ? 5000000 : timeout);
        
        if (verbosity > 5 || su.isSumanDebug()) {
          _suman.log.info('suman.once.pre.js => Executing dep with key = "' + key + '"');
        }
        
        asyncHelper(key, resolve, reject, [acc], 1, fn);
        
      })
      .then(function (val) {
        
        clearTimeout(to);
        
        if (verbosity > 3 || su.isSumanDebug()) {
          _suman.log.info(chalk.green.bold('suman.once.pre.js => Finished sourcing dep with key = "' + key + '"'));
        }
        
        // we store $pre values in this container
        // so that we can pass them to suman.once.post.js later
        _suman.integrantHashKeyVals[key] = val;
        
        return {
          [key]: val
        };
        
      }, function (err) {
        clearTimeout(to);
        return Promise.reject(err);
      })
    });
  };
  
  const promises = depList.map(function (key: string) {
    return getAllPromises(key, []);
  });
  
  return Promise.all(promises).then(function (deps) {
      
      const obj = deps.reduce(Object.assign, {});
      
      if (!_suman.processIsRunner) {
        _suman.log.info(chalk.green.underline.bold('Finished with suman.once.pre.js dependencies.'), '\n');
      }
      
      return obj;
    },
    function (err) {
      
      _suman.log.error(chalk.magenta('There was an error sourcing your dependencies in suman.once.pre.js.'));
      err && _suman.log.error(err.stack || util.inspect(err));
      !err && (err = new Error('No error was defined in error handler.'));
      return Promise.reject(err);
      
    });
};
