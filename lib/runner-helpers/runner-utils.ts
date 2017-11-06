'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');


//project
const _suman = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////

export interface IFindShFunctions {
  (p: string): string | null
}

export const findPathOfRunDotSh: IFindShFunctions = function (p) {

  if(String(p).match(/\/@target\//)){
    return null;
  }

  const root = _suman.projectRoot;
  const ln = root.length;

  while (p.length >= ln) {

    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if (map && map['@run.sh']) {
      return path.resolve(dirname, '@run.sh');
    }

    if (map && map['@config.json']) {

      try{
        let config = require(path.resolve(dirname, '@config.json'));
        let v;
        if(v = config['@run']){
          if(v.prevent){
            // user has decided to prevent any transform for this file
            return null;
          }
          if(v.plugin && v.plugin.value){
            let plugin = require(v.plugin.value);
            return plugin.getRunPath();
          }
        }
      }
      catch(err){
        _suman.log.error(err.message || err);
      }
    }

    p = path.resolve(p + '/../')

  }

  // explicit for your pleasure
  return undefined;
};


export const findPathOfTransformDotSh: IFindShFunctions = function (p) {

  if(String(p).match(/\/@target\//)){
    return null;
  }

  const root = _suman.projectRoot;
  const ln = root.length;

  while (p.length >= ln) {

    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if (map && map['@transform.sh']) {
      return path.resolve(dirname, '@transform.sh');
    }

    // @transform.sh file takes precedence over @config.json file in same dir
    if (map && map['@config.json']) {

      try{
        let config = require(path.resolve(dirname, '@config.json'));
        let v;
        if(v = config['@transform']){
          if(v.prevent){
            // user has decided to prevent any transform for this file
            return null;
          }
          if(v.plugin && v.plugin.value){
            let plugin = require(v.plugin.value);
            return plugin.getTransformPath();
          }
        }
      }
      catch(err){
        _suman.log.error(err.message || err);
      }
    }

    p = path.resolve(p + '/../')

  }

  // explicit for your pleasure
  return undefined;

};


const $exports = module.exports;
export default $exports;
