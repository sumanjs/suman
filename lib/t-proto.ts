'use strict';
import {IPseudoError} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');
const EE = require('events');

//project
const _suman = global.__suman = (global.__suman || {});
const freezeExistingProps = require('./freeze-existing');

/////////////////////////////////////////////////////////////////////////////////

const $proto = Object.create(Function.prototype);
const proto = Object.create(Object.assign($proto, EE.prototype));


proto.wrap = function _wrap(fn: Function) {
  const self = this;
  return function () {
    try {
      fn.apply(this, arguments);
    } catch (e) {
      self.__handle(e, false);
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
  debugger;
  this.timeout = 40000;
  console.log(util.inspect(this));
};


export = freezeExistingProps(proto);


