import Timer = NodeJS.Timer;

type TestSuiteGetterFn <T> = () => Array<T>;

interface IAssertObj {
  num: number
}

interface ITimerObj{
  timer: Timer
}

interface ITestDataObj {
  didNotThrowErrorWithExpectedMessage?: string,
  errorPlanCount: string,
  skipped?: boolean,
  skippedDueToOnly?: boolean,
  skippedDueToItOnly?: boolean,
  testId: number,
  error?: Error | string,
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
  delay?: boolean,
  cb?: boolean,
  type?: 'it-standard',
  timeout?: number,
  desc: string,
  fn?: Function,
  warningErr?: Error
  timedOut?: boolean,
  complete?: boolean,
  dateStarted?: number
}

interface IHookObj {
  desc: string,
  warningErr?: Error,
  errorPlanCount?: string,
  planCountExpected: number
  throws?: RegExp,
  didNotThrowErrorWithExpectedMessage: string
}

interface IAfterObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  cb: boolean,
  throws: RegExp,
  fatal: boolean,
  fn: Function,
  type: string,
  warningErr: Error
}

interface IBeforeEachObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  fn: Function,
  throws: RegExp,
  fatal: boolean,
  cb: boolean,
  type: string,
  warningErr: Error
}


interface IAFterEachObj extends IHookObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  fn: Function,
  throws: RegExp,
  fatal: boolean,
  cb: boolean,
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

  new (opts: ITestSuiteMakerOpts): ITestSuite;

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
