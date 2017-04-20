import Timer = NodeJS.Timer;
import {Subscriber} from "rxjs/Subscriber";
import {Observable} from "rxjs/Observable";

type TestSuiteGetterFn <T> = () => Array<T>;

interface IAssertObj {
  num: number
}

interface ITimerObj{
  timer: Timer
}


interface IHookOrTestCaseParam {
   // either the h or t in h => {} or t => {}
}

interface IHookParam {
    // the h in h => {}
}

interface ITestCaseParam {
    // the t in t => {}
}

type IHandleError = (e: IPseudoError) => void;


type THookCallbackMode = (h: IHookOrTestCaseParam) => void;
type HookRegularMode = (h?: IHookOrTestCaseParam) => Promise<any>;
type HookObservableMode = (h?: IHookOrTestCaseParam) => Observable<any>;
type HookSubscriberMode = (h?: IHookOrTestCaseParam) => Subscriber<any>;
type HookEEMode = (h?: IHookOrTestCaseParam) => EventEmitter;

type Hook = THookCallbackMode |
  HookRegularMode | HookObservableMode
  | HookSubscriberMode | HookEEMode


interface ITestDataObj {
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

interface IInjectionObj extends IHookObj {
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

interface IHookObj {
  desc: string,
  warningErr?: Error,
  errorPlanCount?: string,
  planCountExpected: number
  throws?: RegExp,
  didNotThrowErrorWithExpectedMessage?: string
}

interface IOnceHookObj extends IHookObj {
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

interface IAfterObj extends IOnceHookObj {

}

interface IBeforeObj extends IOnceHookObj {

}


interface IEachHookObj extends IHookObj {
  fatal: boolean,
  timeout: number,
  cb: boolean,
  fn: Hook,
  ctx: ITestSuite,
}


interface IBeforeEachObj extends IEachHookObj {
  desc: string,
  throws: RegExp,
  type: string,
  warningErr: Error
}


interface IAFterEachObj extends IEachHookObj {
  desc: string,
  throws: RegExp,
  type: string,
  warningErr: Error
}


interface ITestSuiteParent {
  testId: number,
  desc: string,
  title: string,
  parallel: boolean

}

interface IInjectedValues {
  [key: string]: any
}

interface ITestSuite {

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
  getAfterEaches: TestSuiteGetterFn<IAFterEachObj>,
  getResumeValue?: Function,
  fatal?: Function,
  resume?: Function,

  // function
  _run?: Function,
  __invokeChildren?: Function,
  __bindExtras: Function

}

interface ITestSuiteBaseInitObjOpts {
  skip: boolean,
  only: boolean,
  mode: string,
  parallel: boolean,
  series: boolean,
  serial: boolean
}


interface ITestSuiteBaseInitObj {
  opts: ITestSuiteBaseInitObjOpts

}
