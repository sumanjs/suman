'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import AssertStatic = Chai.AssertStatic;
import {IHookObj} from "suman-types/dts/test-suite";
import {ITestDataObj} from "suman-types/dts/it";
import {VamootProxy} from "vamoot";
import {IHookOrTestCaseParam} from "suman-types/dts/params";
import {IAssertObj, ITimerObj} from "suman-types/dts/general";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import EE = require('events');
import util = require('util');

//npm
import su = require('suman-utils');
import {freezeExistingProps} from 'freeze-existing-props';
import * as chai from 'chai';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////

// const fproto = Object.create(Function.prototype);
// export const proto = Object.create(Object.assign(fproto, EE.prototype));

interface IBadProps {
  [key: string]: true
}

let badProps = <IBadProps> {
  inspect: true,
  constructor: true
};

const slice = Array.prototype.slice;
const notCallbackOrientedError = 'You have fired a callback for a test case or hook that was not callback oriented.';

export abstract class ParamBase extends EE implements IHookOrTestCaseParam {

  protected __timerObj: ITimerObj;
  protected __handle: Function;
   __shared: VamootProxy;
  protected __fini: Function;
  public callbackMode?: boolean;
  assert: typeof chai.assert;
  should: typeof chai.should;
  expect: typeof chai.expect;
  protected __tooLate: boolean;
  desc: string;
  state: 'pending' | 'errored' | 'completed';

  constructor() {
    super();
  }

  abstract onTimeout(): void;

  timeout(val: number) {
    this.__timerObj.timer && clearTimeout(this.__timerObj.timer);
    try {
      assert(val && Number.isInteger(val), 'value passed to timeout() must be an integer.');
    }
    catch (e) {
      return this.__handle(e);
    }

    const amount = _suman.weAreDebugging ? 5000000 : val;
    this.__timerObj.timer = setTimeout(this.onTimeout.bind(this), amount) as any;
  }

  done(err?: Error) {
    if (this && this.__handle) {
      this.__handle(new Error(notCallbackOrientedError));
    }
    else {
      throw new Error(notCallbackOrientedError)
    }
  }

  fatal(err: any) {
    if (!err) {
      err = new Error('t.fatal() was called by the developer, with a falsy first argument.');
    }
    else if (!su.isObject(err)) {
      let msg = 't.fatal() was called by the developer: ';
      err = new Error(msg + util.inspect(err));
    }
    err.sumanFatal = true;
    this.__handle(err);
  }

  set(k: string, v: any) {
    if (arguments.length < 2) {
      throw new Error('Must pass both a key and value to "set" method.');
    }
    return this.__shared.set(k, v);
  }

  get(k?: string) {
    if (arguments.length < 1) {
      return this.__shared.getAll();
    }
    return this.__shared.get(k);
  }

  getValues(...args: Array<string>) {
    const self = this;
    return args.map(function (k) {
      return self.__shared.get(k);
    });
  }

  getMap(...args: Array<string>) {
    const self = this;
    const ret = {} as any;
    args.forEach(function (a) {
      ret[a] = self.__shared.get(a);
    });
    return ret;
  }

  wrap(fn: Function) {
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

  wrapFinal(fn: Function) {
    const self = this;
    return function () {
      try {
        fn.apply(this, arguments);
      }
      catch (e) {
        return self.__handle(e, false);
      }

      self.__fini(null);
    }
  }

  final(fn: Function, ctx?: any) {
    try {
      fn.call(ctx || null);
    }
    catch (e) {
      return this.__handle(e, false);
    }

    this.__fini(null);
  }

  finally(fn: Function, ctx?: any) {
    return this.final.apply(this, arguments);
  }

  log(...args: Array<any>) {
    console.log(` [ '${this.desc || 'unknown'}' ] `, ...args);
  }

  slow() {
    this.timeout(30000);
  }

  wrapFinalErrorFirst(fn: Function) {
    const self = this;
    return function (err: Error) {
      if (err) {
        return self.__handle(err, false);
      }
      try {
        fn.apply(this, slice.call(arguments, 1));
      }
      catch (e) {
        return self.__handle(e, false);
      }

      self.__fini(null);
    }
  }

  wrapErrorFirst(fn: Function) {
    const self = this;
    return function (err: any) {
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
  }

  handleAssertions(fn: Function, ctx?: any) {
    try {
      return fn.call(ctx || null);
    }
    catch (e) {
      return this.__handle(e);
    }
  }

  handlePossibleError(err: any) {
    err ? this.__handle(err) : this.__fini(null)
  }

  handleNonCallbackMode(err: any) {
    err = err ? ('Also, you have this error => ' + err.stack || err) : '';
    this.__handle(new Error('Callback mode for this test-case/hook is not enabled, use .cb to enabled it.\n' + err));
  }

  throw(str: any) {
    this.__handle(str instanceof Error ? str : new Error(str));
  }

}

export interface ParamBase {
  pass: typeof ParamBase.prototype.done;
  ctn: typeof ParamBase.prototype.done;
  fail: typeof ParamBase.prototype.done;
  finalErrFirst: typeof ParamBase.prototype.final;
  finalErrorFirst: typeof ParamBase.prototype.final;
  wrapFinalErrFirst: typeof ParamBase.prototype.wrapFinalErrorFirst;
  wrapFinalErr: typeof ParamBase.prototype.wrapFinalErrorFirst;
  wrapFinalError: typeof ParamBase.prototype.wrapFinalErrorFirst;
  wrapErrFirst: typeof ParamBase.prototype.wrapErrorFirst;
}

// Alternative:
Object.setPrototypeOf(ParamBase.prototype, Function.prototype);
const proto = Object.assign(ParamBase.prototype, EE.prototype);

// const proto = Object.assign(ParamBase.prototype, Function.prototype, EE.prototype);
proto.pass = proto.ctn = proto.fail = proto.done;
proto.wrapFinalErrFirst = proto.wrapFinalErr = proto.wrapFinalError = proto.wrapFinalErrorFirst;
proto.wrapErrFirst = proto.wrapErrorFirst;
// proto.finalErrFirst = proto.finalErrorFirst = proto.fi

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
        return (chai.expect as any)[prop].apply(chai.expect, arguments);
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

const assertProxy = new Proxy(assrt, {
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
        return (chai.assert as any)[prop].apply(chai.assert, arguments);
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
    return assertProxy;
  }
});
