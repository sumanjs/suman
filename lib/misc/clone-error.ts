'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {constants} from '../../config/suman-constants';

//////////////////////////////////////////////////////////////////////////////

export interface ICloneErrorFn {
  (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError
}

///////////////////////////////////////////////////////////////////////////////

export const cloneError: ICloneErrorFn = function (err, newMessage, stripAllButTestFilePathMatch) {

  const obj = {} as IPseudoError;
  obj.message = newMessage || `Suman implementation error: "newMessage" is not defined. Please report: ${constants.SUMAN_ISSUE_TRACKER_URL}.`;
  let temp;
  if (stripAllButTestFilePathMatch !== false) {
    temp = su.createCleanStack(String(err.stack || err));
  }
  else{
    temp = String(err.stack || err).split('\n');
  }
  temp[0] = newMessage;

  obj.message = newMessage;
  obj.stack = temp.join('\n');
  return obj;

};
