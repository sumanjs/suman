/// <reference path="../node_modules/@types/chai/index.d.ts" />

import Timer = NodeJS.Timer;
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";
import {IPseudoError} from "./global";
import EventEmitter = NodeJS.EventEmitter;
import {ITestSuiteMakerOpts} from "./test-suite-maker";
import {ITestDataObj} from "./it";
import {IBeforeEachObj} from "./before-each";
import {IAfterObj} from "./after";
import {IAFterEachObj} from "./after-each";
import AssertStatic = Chai.AssertStatic;


/////////////////////////////////////////////////////////////////////

export type TestSuiteGetterFn <T> = () => Array<T>;

export interface IAssertObj {
  num: number
}

export interface ITimerObj {
  timer: any
}

export interface IAllOpts {
  __preParsed: boolean
}

export interface IHookOrTestCaseParam {
  // either the h or t in h => {} or t => {}

  assert: AssertStatic,
  slow: Function,
  log: Function,
  wrapErrFirst: Function,
  wrapErrorFirst: Function,
  wrap: Function,
  fatal : Function
  callbackMode: boolean,
  timeout: Function,
  done: Function,

}

export interface IHookParam extends IHookOrTestCaseParam {
  // the h in h => {}
  (err?: Error): void,
  ctn: Function,
}

export interface ITestCaseParam extends IHookOrTestCaseParam {
  // the t in t => {}
  (err?: Error): void
  skip: Function,
  pass: Function,
  fail: Function
}

export type IHandleError = (e: IPseudoError) => void;
export type THookCallbackMode = (h: IHookOrTestCaseParam) => void;
export type HookRegularMode = (h?: IHookOrTestCaseParam) => Promise<any>;
export type HookObservableMode = (h?: IHookOrTestCaseParam) => Observable<any>;
export type HookSubscriberMode = (h?: IHookOrTestCaseParam) => Subscriber<any>;
export type HookEEMode = (h?: IHookOrTestCaseParam) => EventEmitter;

export type THook = THookCallbackMode |
  HookRegularMode | HookObservableMode
  | HookSubscriberMode | HookEEMode

export interface IInjectionObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  cb: boolean,
  throws: RegExp,
  fatal: boolean,
  fn: THook,
  type: string,
  warningErr: Error
}

export interface IHookObj {
  alreadyInitiated?: boolean,
  desc: string,
  warningErr?: Error,
  errorPlanCount?: string,
  planCountExpected: number
  throws?: RegExp,
  didNotThrowErrorWithExpectedMessage?: string,
  ctx: ITestSuite,
  timeout: number,
  cb: boolean,
  fatal: boolean,
  fn: THook,
  type: string,
}

export interface IOnceHookObj extends IHookObj {

}

export interface IEachHookObj extends IHookObj {

}

export interface IInjectedValues {
  [key: string]: any
}

export interface ITestSuiteBase {

  injectedValues: IInjectedValues,

  // getters
  getInjections: Function,
  getChildren: Function,

  getTests: TestSuiteGetterFn<ITestDataObj>,
  getParallelTests: TestSuiteGetterFn<ITestDataObj>,
  getTestsParallel: TestSuiteGetterFn<any>,
  getLoopTests: TestSuiteGetterFn<any>,
  getBefores: TestSuiteGetterFn<any>,
  getBeforeEaches: TestSuiteGetterFn<IBeforeEachObj>,
  getAfters: TestSuiteGetterFn<IAfterObj>,
  getAftersLast: TestSuiteGetterFn<IAfterObj>,
  getAfterEaches: TestSuiteGetterFn<IAFterEachObj>,
  getResumeValue?: Function,
  fatal?: Function,
  resume?: Function,

}

export interface ITestSuite extends ITestSuiteBase {

  new (opts: ITestSuiteMakerOpts): void;
  [key: string]: any,

  // object
  opts: Object,
  parent: ITestSuite,

  //number
  testId: number,

  //boolean
  skippedDueToDescribeOnly: boolean,
  isSetupComplete: boolean,
  parallel: boolean,
  skipped: boolean,
  only: boolean,

  // string
  desc: string,
  filename: string,
  fileName: string


  // function
  _run?: Function,
  __invokeChildren?: Function,
  __bindExtras: Function

}

export interface ITestSuiteBaseInitObjOpts {
  skip: boolean,
  only: boolean,
  mode: string,
  parallel: boolean,
  series: boolean,
  serial: boolean
}

export interface ITestSuiteBaseInitObj {
  opts: ITestSuiteBaseInitObjOpts

}
