'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import AssertStatic = Chai.AssertStatic;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import {freezeExistingProps} from 'freeze-existing-props';
const chai = require('chai');
const chaiAssert = chai.assert;

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
  if (arguments.length < 2) {
    throw new Error('Must pass both a key and value to "set" method.');
  }
  return this.__shared.set(k, v);
};

proto.get = function (k?: string) {
  if (arguments.length < 1) {
    return this.__shared.getAll();
  }
  return this.__shared.get(k);
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

proto.wrapFinal = function (fn: Function) {
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

proto.final = function (fn: Function) {
  try {
    fn.apply(null, arguments);
    this.__fini(null);
  }
  catch (e) {
    this.__handle(e, false);
  }
};

const slice = Array.prototype.slice;

proto.wrapFinalErr = proto.wrapFinalErrFirst = proto.wrapFinalErrorFirst = proto.wrapFinalError = function (fn: Function) {
  const self = this;
  return function (err: Error) {
    if (err) return self.__handle(err, false);
    try {
      fn.apply(this, slice.call(arguments, 1));
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
      return fn.apply(this, slice.call(arguments, 1));
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

let assertCtx: any = {
  // this is used to store the context
  val: null
};

const assrt = <Partial<AssertStatic>> function () {
  
  const ctx = assertCtx.val;
  
  if (!ctx) {
    throw new Error('Suman implementation error => assert context is not defined.');
  }
  
  try {
    return chaiAssert.apply(chaiAssert, arguments);
  }
  catch (e) {
    return ctx.__handleError(e);
  }
};

const p = new Proxy(assrt, {
  get: function (target, prop) {
    
    if (typeof prop === 'symbol') {
      return Reflect.get.apply(Reflect, arguments);
    }
    
    const ctx = assertCtx.val;
    
    if (!ctx) {
      throw new Error('Suman implementation error => assert context is not defined.');
    }
    
    if (!(prop in chaiAssert)) {
      try {
        return Reflect.get.apply(Reflect, arguments);
      }
      catch (err) {
        return ctx.__handleError(
          new Error(`The assertion library used does not have a '${prop}' property or method.`)
        );
      }
    }
    
    return function () {
      try {
        return chaiAssert[prop].apply(chaiAssert, arguments);
      }
      catch (e) {
        return ctx.__handleError(e);
      }
    }
  }
});

Object.defineProperty(proto, 'assert', {
  get: function () {
    assertCtx.val = this;
    return p;
  }
});

export const tProto = freezeExistingProps(proto);


