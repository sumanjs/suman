import Timer = NodeJS.Timer;
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";
import {IPseudoError} from "./global";
import EventEmitter = NodeJS.EventEmitter;
import {ITestSuiteMakerOpts} from "./test-suite-maker";
import {IRawTestData} from "./it";

export type TestSuiteGetterFn <T> = () => Array<T>;

export interface IAssertObj {
  num: number
}

export interface ITimerObj{
  timer: Timer
}


export interface IHookOrTestCaseParam {
   // either the h or t in h => {} or t => {}
}

export interface IHookParam {
    // the h in h => {}
}

export interface ITestCaseParam {
    // the t in t => {}
}

export type IHandleError = (e: IPseudoError) => void;

export type THookCallbackMode = (h: IHookOrTestCaseParam) => void;
export type HookRegularMode = (h?: IHookOrTestCaseParam) => Promise<any>;
export type HookObservableMode = (h?: IHookOrTestCaseParam) => Observable<any>;
export type HookSubscriberMode = (h?: IHookOrTestCaseParam) => Subscriber<any>;
export type HookEEMode = (h?: IHookOrTestCaseParam) => EventEmitter;

export type Hook = THookCallbackMode |
  HookRegularMode | HookObservableMode
  | HookSubscriberMode | HookEEMode


export interface ITestDataObj {
  alreadyInitiated: boolean,
  sumanModulePath?: string,
  didNotThrowErrorWithExpectedMessage?: string,
  errorPlanCount?: string,
  skipped?: boolean,
  skippedDueToOnly?: boolean,
  skippedDueToItOnly?: boolean,
  testId: number,
  error?: Error | string,
  errorDisplay?: string,
  stubbed?: boolean,
  data?: IRawTestData,
  planCountExpected?: number,
  originalOpts?: Object,
  only?: boolean,
  skip?: boolean,
  value?: Object,
  throws?: RegExp,
  parallel?: boolean,
  mode?: string,
  delay?: number,
  cb?: boolean,
  type?: 'it-standard',
  timeout?: number,
  desc: string,
  fn?: Hook,
  warningErr?: Error
  timedOut?: boolean,
  complete?: boolean,
  dateStarted?: number,
  dateComplete?: number,
  skippedDueToParentSkipped?: boolean,
  skippedDueToParentOnly?: boolean
}

export interface IInjectionObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  cb: boolean,
  throws: RegExp,
  fatal: boolean,
  fn: Hook,
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
  didNotThrowErrorWithExpectedMessage?: string
}

export interface IOnceHookObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  cb: boolean,
  throws: RegExp,
  fatal: boolean,
  fn: Hook,
  type: string,
  warningErr: Error
}

export interface IAfterObj extends IOnceHookObj {
  last: boolean,
  always: boolean

}

export interface IBeforeObj extends IOnceHookObj {

}


export interface IEachHookObj extends IHookObj {
  fatal: boolean,
  timeout: number,
  cb: boolean,
  fn: Hook,
  ctx: ITestSuite,
}


export interface IBeforeEachObj extends IEachHookObj {
  desc: string,
  throws: RegExp,
  type: string,
  warningErr: Error
}


export interface IAFterEachObj extends IEachHookObj {
  desc: string,
  throws: RegExp,
  type: string,
  warningErr: Error
}


export interface ITestSuiteParent {
  testId: number,
  desc: string,
  title: string,
  parallel: boolean

}

export interface IInjectedValues {
  [key: string]: any
}

export interface ITestSuite {

  new (opts: ITestSuiteMakerOpts): void;
  [key: string]: any,

  // object
  opts: Object,
  parent: ITestSuiteParent,

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
