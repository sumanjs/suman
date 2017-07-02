'use strict';
import {IGlobalSumanObj, IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

//////////////////////////////////////////////////////////////////////////////

export interface ICloneErrorFn {
  (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError
}

///////////////////////////////////////////////////////////////////////////////

export const cloneError: ICloneErrorFn = function (err, newMessage, stripAllButTestFilePathMatch) {

  const obj = {} as IPseudoError;
  obj.message = newMessage || ' => Suman implementation error => newMessage is not defined. Please report on Github issue tracker.';
  let temp = err.stack.split('\n');
  if (stripAllButTestFilePathMatch !== false) {
    temp = temp.filter(function (line, index) {
      return !String(line).match(/\/node_modules\//);
    });
  }
  temp[0] = newMessage;
  temp = temp.map(function (item) {
    // return '\t' + item;
    return item;
  });
  obj.message = newMessage;
  obj.stack = temp.join('\n');
  return obj;

};
