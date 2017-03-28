type TestSuiteGetterFn <T> = () => Array<T>;


interface ITestDataObj {
  skipped?: boolean,
  skippedDueToItOnly?: boolean,
  testId: number,
  error?: string,
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
}


interface IAfterObj {
  ctx: ITestSuite,
  timeout: number,
  desc: string,
  cb: boolean,
  throws: RegExp,
  planCountExpected: number,
  fatal: boolean,
  fn: Function,
  type: string,
  warningErr: Error
}


interface ITestSuiteParent {
  testId: number,
  desc: string,
  title: string,
  parallel: boolean

}

interface ITestSuite {

  new (opts: ITestSuiteMakerOpts): ITestSuite;

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
  injectedValues: Object,

  // getters
  getInjections: Function,
  getChildren: Function,

  getTests: TestSuiteGetterFn<ITestDataObj>,
  getParallelTests: TestSuiteGetterFn<ITestDataObj>,

  getTestsParallel: TestSuiteGetterFn<any>,

  getLoopTests: TestSuiteGetterFn<any>,

  getBefores: TestSuiteGetterFn<any>,

  getBeforeEaches: TestSuiteGetterFn<any>,

  getAfters: TestSuiteGetterFn<IAfterObj>,

  getAfterEaches: TestSuiteGetterFn<any>,

  getResumeValue?: Function,
  fatal?: Function,
  resume?: Function,

  // function
  _run?: Function,
  __invokeChildren?: Function,
  __bindExtras: Function

}
