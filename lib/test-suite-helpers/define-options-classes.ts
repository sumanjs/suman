'use strict';

//dts
import {TDescribeHook} from "suman-types/dts/describe";
import {TBeforeEachHook} from "suman-types/dts/before-each";
import {TAfterEachHook} from "suman-types/dts/after-each";
import {TBeforeHook} from "suman-types/dts/before";
import {TAfterHook} from "suman-types/dts/after";
import {ItHook} from "suman-types/dts/it";

//core
import assert = require('assert');

//npm
import _ = require('lodash');
import su = require('suman-utils');


//////////////////////////////////////////////////////////////////////////////////////////

export class DefineObject {
  
  protected exec: any;
  protected opts: any;
  
  constructor(desc: string, exec: any) {
    this.exec = exec;
    this.opts = {
      '@DefineObjectOpts': true,
      __preParsed: false,
      desc: desc || '(unknown description/title/name)',
    };
  }
  
  inject(): DefineObject {
    return this;
  }
  
  plan(v: number): DefineObject {
    assert(Number.isInteger(v), 'Argument to plan must be an integer.');
    this.opts.planCount = v;
    return this;
  }
  
  desc(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "desc" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  title(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "title" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  name(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "name" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  description(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "description" must be a string.');
    this.opts.desc = v;
    return this;
  }
  
  skip(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "skip" must be a boolean.');
    this.opts.skip = v;
    return this;
  }
  
  only(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "only" must be a boolean.');
    this.opts.only = v;
    return this;
  }
  
  parallel(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.parallel = v;
    return this;
  }
  
  series(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.series = v;
    return this;
  }
  
  mode(v: string): DefineObject {
    assert.equal(typeof v, 'string', 'Value for "mode" must be a string.');
    this.opts.mode = v;
    return this;
  }
  
  timeout(v: number): DefineObject {
    assert(Number.isInteger(v), 'Timeout value must be an integer.');
    this.opts.timeout = v;
    return this;
  }
  
}


export interface IDefineObject {
  new (desc: string, exec: any): DefineObject;
}

export class DefineObjectTestOrHook extends DefineObject {
  
  throws(v: string | RegExp): DefineObject {
    if (typeof v === 'string') {
      v = new RegExp(v);
    }
    else if (!(v instanceof RegExp)) {
      throw new Error('Value for "throws" must be a String or regular expression (RegExp instance).');
    }
    this.opts.throws = v;
    return this;
  }
  
  cb(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "cb" must be a boolean.');
    this.opts.cb = v;
    return this;
  }
  
  events(): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  successEvents(...args: (string | Array<string>)[]): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  successEvent(...args: string[]): DefineObject {
    
    const successEvents = this.opts.successEvents = this.opts.successEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "successEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "successEvent" must be a string.');
      successEvents.push(v);
    });
    
    return this;
  }
  
  errorEvents(...args: (Array<string> | string)[]): DefineObject {
    
    const errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
      errorEvents.push(v);
    });
    
    return this;
  }
  
  errorEvent(...args: string[]): DefineObject {
    
    const errorEvents = this.opts.errorEvents = this.opts.errorEvents || [];
    _.flattenDeep([Array.from(arguments)]).forEach(function (v) {
      assert(v, 'Value was going to be added to "errorEvents", but value is falsy');
      assert.equal(typeof v, 'string', 'Value for "errorEvent" must be a string.');
      errorEvents.push(v);
    });
    
    return this;
  }
  
}

export class DefineObjectAllHook extends DefineObjectTestOrHook {
  
  fatal(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
    this.opts.fatal = v;
    return this;
  }
  
  first(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "first" must be a boolean.');
    this.opts.first = v;
    return this;
  }
  
  last(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "last" must be a boolean.');
    this.opts.last = v;
    return this;
  }
  
  always(v: boolean): DefineObject {
    assert.equal(typeof v, 'boolean', 'Value for "always" must be a boolean.');
    this.opts.always = v;
    return this;
  }
  
  run(fn: TBeforeHook | TAfterHook): DefineObject {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectEachHook extends DefineObjectTestOrHook {
  
  fatal(v: boolean): DefineObjectTestOrHook {
    assert.equal(typeof v, 'boolean', 'Value for "fatal" must be a boolean.');
    this.opts.fatal = v;
    return this;
  }
  
  run(fn: TBeforeEachHook | TAfterEachHook): DefineObjectTestOrHook {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectTestCase extends DefineObjectTestOrHook {
  
  run(fn: ItHook): DefineObjectTestCase {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}

export class DefineObjectContext extends DefineObject {
  
  source(...args: string[]): DefineObjectContext {
    this.opts.sourced = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }
  
  names(...args: string[]): DefineObjectContext {
    this.opts.names = Array.from(arguments).reduce(function (a, b) {
      return a.concat(b);
    }, []);
    return this;
  }
  
  run(fn: TDescribeHook): DefineObjectContext {
    const name = this.opts.desc || '(unknown DefineObject name)';
    const opts = JSON.parse(su.customStringify(this.opts));
    this.exec.call(null, name, opts, fn);
    return this;
  }
  
}
