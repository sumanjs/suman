'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {makeIt} from '../test-suite-methods/make-it';
import {makeAfter} from '../test-suite-methods/make-after';
import {makeAfterEach} from '../test-suite-methods/make-after-each';
import {makeBeforeEach} from '../test-suite-methods/make-before-each';
import {makeBefore} from '../test-suite-methods/make-before';
import {makeInject} from '../test-suite-methods/make-inject';
import {makeDescribe} from '../test-suite-methods/make-describe';
import {makeAfterAllParentHooks} from '../test-suite-methods/make-after-all-parent-hooks';
import {IInjectFn} from "suman-types/dts/inject";
import {IGlobalSumanObj} from "suman-types/dts/global";
import {IBeforeFn} from "suman-types/dts/before";
import {ItFn} from "suman-types/dts/it";
import {IDescribeFn} from "suman-types/dts/describe";
import {IBeforeEachFn} from "suman-types/dts/before-each";
import {IAfterEachFn} from "suman-types/dts/after-each";
import {IAfterFn} from "suman-types/dts/after";
import {TestBlockBase} from "./test-block-base";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import assert = require('assert');
import util = require('util');

//npm
const pragmatik = require('pragmatik');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import rules = require('../helpers/handle-varargs');
const {constants} = require('../../config/suman-constants');
import {makeProxy} from './make-proxy';
import {makeBlockInjector} from '../injection/make-block-injector';

/////////////////////////////////////////////////////////////////////

export const makeSumanMethods = function (suman: ISuman, TestBlock: TestBlockBase,
                                          gracefulExit: Function, notifyParent: Function): any {

  const m = {} as any;

  const blockInjector = makeBlockInjector(suman, m);
  const inject: IInjectFn = makeInject(suman);
  const before: IBeforeFn = makeBefore(suman);
  const after: IAfterFn = makeAfter(suman);
  const beforeEach: IBeforeEachFn = makeBeforeEach(suman);
  const afterEach: IAfterEachFn = makeAfterEach(suman);
  const it: ItFn = makeIt(suman);
  const afterAllParentHooks = makeAfterAllParentHooks(suman);
  const describe: IDescribeFn = makeDescribe(suman, gracefulExit, TestBlock, notifyParent, blockInjector);

  /////////////////////////////////////////////////////////////////////////////////////////

  const getProxy = makeProxy(suman);
  m.describe = m.context = m.suite = getProxy(describe, rules.blockSignature) as IDescribeFn;
  m.it = m.test = getProxy(it, rules.testCaseSignature) as ItFn;
  m.inject = getProxy(inject, rules.hookSignature) as IInjectFn;
  m.before = m.beforeall = m.setup = getProxy(before, rules.hookSignature) as IBeforeFn;
  m.beforeeach = m.setuptest = getProxy(beforeEach, rules.hookSignature) as IBeforeEachFn;
  m.after = m.afterall = m.teardown = getProxy(after, rules.hookSignature) as IAfterFn;
  m.aftereach = m.teardowntest = getProxy(afterEach, rules.hookSignature) as IAfterEachFn;
  m.afterallparenthooks = getProxy(afterAllParentHooks, rules.hookSignature) as Function;

  return blockInjector;

};
