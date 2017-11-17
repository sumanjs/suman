'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import {freezeExistingProps} from 'freeze-existing-props';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////

const fproto = Object.create(Function.prototype);
const proto = Object.create(Object.assign(fproto, EE.prototype));

proto.skip = function () {
  (this.__hook || this.__test).skipped = true;
  (this.__hook || this.__test).dynamicallySkipped = true;
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
    }
    catch (e) {
      return self.__handle(e, false);
    }
  }
};

proto.final = function (fn: Function) {
  const self = this;
  return function () {
    try {
      fn.apply(this, arguments);
      self.__fini(null);
    }
    catch (e) {
      self.__handle(e, false);
    }
  }
};

proto.finalErrFirst = proto.finalErrorFirst = function (fn: Function) {
  const self = this;
  return function (err: Error) {
    if (err) {
      return self.__handle(err, false);
    }
    try {
      fn.apply(this, Array.from(arguments).slice(1));
      self.__fini(null);
    }
    catch (e) {
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
    }
    catch (e) {
      return self.__handle(e, false);
    }
  }
};

proto.handleAssertions = proto.wrapAssertions = function (fn: Function) {
  try {
    fn.call(null);
  }
  catch (e) {
    this.__handleErr(e);
  }
};

proto.log = function (...args: Array<string>) {
  console.log(` [ '${this.desc || 'unknown'}' ] `, ...args);
};

proto.slow = function () {
  this.timeout(30000);
};

export const tProto = freezeExistingProps(proto);


