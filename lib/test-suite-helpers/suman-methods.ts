'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {makeIt} from '../test-suite-methods2/make-it';
import {makeAfter} from '../test-suite-methods2/make-after';
import {makeAfterEach} from '../test-suite-methods2/make-after-each';
import {makeBeforeEach} from '../test-suite-methods2/make-before-each';
import {makeBefore} from '../test-suite-methods2/make-before';
import {makeInject} from '../test-suite-methods2/make-inject';
import {makeDescribe} from '../test-suite-methods2/make-describe';
import {makeAfterAllParentHooks} from '../test-suite-methods2/make-after-all-parent-hooks';
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ITestSuite, TestSuiteMethodType} from "suman-types/dts/test-suite";
import {ITestSuiteMakerOpts, TTestSuiteMaker} from "suman-types/dts/test-suite-maker";
import {ItFn} from "suman-types/dts/it";
import {IDescribeFn} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');

//project
const rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeProxy} from './make-proxy';

/////////////////////////////////////////////////////////////////////

export const makeSumanMethods = function (suman: ISuman, TestBlock: any) {

  const methods = {};

  const inject: IInjectFn = makeInject(suman, this);
  const before: IBeforeFn = makeBefore(suman, this);
  const after: IAfterFn = makeAfter(suman, this);
  const beforeEach: IBeforeEachFn = makeBeforeEach(suman, this);
  const afterEach: IAfterEachFn = makeAfterEach(suman, this);
  const it: ItFn = makeIt(suman, this);
  const afterAllParentHooks = makeAfterAllParentHooks(suman, this);
  const describe: IDescribeFn = makeDescribe(suman, gracefulExit, TestBlock, this, notifyParent, blockInjector);

  /////////////////////////////////////////////////////////////////////////////////////////

  const getProxy = makeProxy(suman);

  // _interface === 'TDD' ? this.setup = before : this.before = before;
  this.describe = this.context = this.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
  this.it = this.test = getProxy(it, rules.testCaseSignature) as ItFn;
  this.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
  this.before = this.beforeAll = this.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
  this.beforeEach = this.setupTest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
  this.after = this.afterAll = this.teardown = getProxy(after, rules.hookSignature) as IAfterFn;
  this.afterEach = this.teardownTest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
  this.afterAllParentHooks = getProxy(afterAllParentHooks, rules.hookSignature) as Function;

  return methods;

};
