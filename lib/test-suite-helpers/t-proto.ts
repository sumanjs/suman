'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import chai = require('chai');
import {freezeExistingProps} from 'freeze-existing-props';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////

const $proto = Object.create(Function.prototype);
const proto = Object.create(Object.assign($proto, EE.prototype));

proto.skip = function () {
  throw new Error('Dynamic skip functionality is not supported by Suman, yet.');
};

proto.set = function (k: string, v: any) {
  return this.shared.set(k, v);
};

proto.get = function (k: string) {
  return this.shared.get(k);
};

proto.wrap = function (fn: Function) {
  const self = this;
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (e) {
      return self.__handle(e, false);
    }
  }
};

proto.wrapErrorFirst = proto.wrapErrFirst = function (fn: Function) {
  const self = this;
  return function (err: IPseudoError) {
    if (err) {
      return self.__handle(err, false);
    }
    try {
      // remove the error-first argument
      return fn.apply(this, Array.from(arguments).slice(1));
    } catch (e) {
      return self.__handle(e, false);
    }
  }
};

proto.log = function () {
  _suman.writeLog.apply(null, arguments);
};

proto.slow = function () {
  this.timeout(30000);
};

export const tProto = freezeExistingProps(proto);


