


import {ITestCaseParam, THook} from "./test-suite";


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
  fn?: THook,
  warningErr?: Error
  timedOut?: boolean,
  complete?: boolean,
  dateStarted?: number,
  dateComplete?: number,
  skippedDueToParentSkipped?: boolean,
  skippedDueToParentOnly?: boolean
}

type ItFnArgs = IItOpts | ItHook | Array<string | ItHook>


export interface ItFn {
  (desc: string, ...args: ItFnArgs[]): void,
  skip?: ItFn,
  only?: ItFn,
  cb?: ItFn
}

export interface IRawTestData {
  //empty
}

export interface IItOpts {
  __preParsed: boolean,
  parallel: boolean,
  series: boolean,
  serial: boolean,
  mode: string,
  delay: number
}




export type ItHookCallbackMode = (t: ITestCaseParam) => void;
export type ItHookRegularMode = (t?: ITestCaseParam) => Promise<any>;

export type ItHook = ItHookCallbackMode | ItHookRegularMode;
