'use strict';

//dts
import {IGlobalSumanObj, IPseudoError} from "suman-types/dts/global";
import AssertStatic = Chai.AssertStatic;

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');
import util = require('util');

//npm
import su = require('suman-utils');
import {freezeExistingProps} from 'freeze-existing-props';
const chai = require('chai');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////

const fproto = Object.create(Function.prototype);
const proto = Object.create(Object.assign(fproto, EE.prototype));

proto.skip = function () {
  (this.__hook || this.__test).skipped = true;
  (this.__hook || this.__test).dynamicallySkipped = true;
};

proto.done = proto.pass = proto.ctn = proto.fail = function () {
  this.__handle(new Error('You have fired a callback for a test case or hook that was not callback oriented.'));
};

proto.fatal = function fatal(err: IPseudoError) {
  if(!err){
    err = new Error('t.fatal() was called by the developer, with a falsy first argument.');
  }
  else if(!su.isObject(err)){
    let msg = 't.fatal() was called by the developer: ';
    err = new Error(msg + util.inspect(err));
  }
  err.sumanFatal = true;
  this.__handle(err);
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

proto.gets = proto.getMany = function (...args: Array<string>) {
  const self = this;
  return args.map(function (k) {
    return self.__shared.get(k);
  });
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
    if (err) {
      return self.__handle(err, false);
    }
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
    return fn.call(null);
  }
  catch (e) {
    return this.__handle(e);
  }
};

proto.log = function (...args: Array<string>) {
  console.log(` [ '${this.desc || 'unknown'}' ] `, ...args);
};

proto.slow = function () {
  this.timeout(30000);
};

const assertCtx: any = {
  // this is used to store the context
  val: null
};

const expectCtx: any = {
  // this is used to store the context
  val: null
};

const expct = <Partial<AssertStatic>> function () {
  
  const ctx = expectCtx.val;
  
  if (!ctx) {
    throw new Error('Suman implementation error => expect context is not defined.');
  }
  
  try {
    return chai.expect.apply(chai.expect, arguments);
  }
  catch (e) {
    return ctx.__handle(e);
  }
};

const expectProxy = new Proxy(expct, {
  get: function (target, prop) {
    
    if (typeof prop === 'symbol') {
      return Reflect.get.apply(Reflect, arguments);
    }
    
    const ctx = expectCtx.val;
    
    if (!ctx) {
      throw new Error('Suman implementation error => assert context is not defined.');
    }
    
    if (!(prop in chai.expect)) {
      try {
        return Reflect.get.apply(Reflect, arguments);
      }
      catch (err) {
        return ctx.__handle(
          new Error(`The assertion library used does not have a '${prop}' property or method.`)
        );
      }
    }
    
    return function () {
      try {
        return chai.expect[prop].apply(chai.expect, arguments);
      }
      catch (e) {
        return ctx.__handle(e);
      }
    }
  }
});

Object.defineProperty(proto, 'expect', {
  get: function () {
    expectCtx.val = this;
    return expectProxy;
  }
});

const assrt = <Partial<AssertStatic>> function () {
  
  const ctx = assertCtx.val;
  
  if (!ctx) {
    throw new Error('Suman implementation error => assert context is not defined.');
  }
  
  try {
    return chai.assert.apply(chai.assert, arguments);
  }
  catch (e) {
    return ctx.__handle(e);
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
    
    if (!(prop in chai.assert)) {
      try {
        return Reflect.get.apply(Reflect, arguments);
      }
      catch (err) {
        return ctx.__handle(
          new Error(`The assertion library used does not have a '${prop}' property or method.`)
        );
      }
    }
    
    return function () {
      try {
        return chai.assert[prop].apply(chai.assert, arguments);
      }
      catch (e) {
        return ctx.__handle(e);
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

// export const tProto = freezeExistingProps(proto);

export const tProto = proto;
