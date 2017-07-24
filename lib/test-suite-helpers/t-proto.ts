'use strict';
import {IPseudoError} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import chai = require('chai');
import {freezeExistingProps} from 'freeze-existing-props';

//project
const _suman = global.__suman = (global.__suman || {});


/////////////////////////////////////////////////////////////////////////////////

const $proto = Object.create(Function.prototype);
const proto = Object.create(Object.assign($proto, EE.prototype));


proto.wrap = function _wrap(fn: Function) {
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


proto.log = function _log() {  //TODO: update this
  _suman._writeLog.apply(null, arguments);
};

proto.slow = function _slow() {
  this.timeout(20000);
};


export const tProto = freezeExistingProps(proto);


