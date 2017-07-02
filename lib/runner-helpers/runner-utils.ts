'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as util from 'util';
import * as path from 'path';


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

    p = path.resolve(p + '/../')

  }

  // explicit for your pleasure
  return undefined;

};


const $exports = module.exports;
export default $exports;
