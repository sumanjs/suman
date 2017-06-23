


import {ITestCaseParam, THook, ITestSuite} from "./test-suite";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import EventEmitter = NodeJS.EventEmitter;


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


type ISubsetItOpts = Partial<IItOpts>;
type ItFnArgs = ISubsetItOpts | ItHook | Array<string | ISubsetItOpts | ItHook>

export interface ItFn {
  (desc: string, ...args: ItFnArgs[]): ITestSuite,
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
export type ItHookObservableMode = (t?: ITestCaseParam) => Observable<any>;
export type ItHookSubscriberMode = (t?: ITestCaseParam) => Subscriber<any>;
export type ItHookEEMode = (t?: ITestCaseParam) => EventEmitter;



export type ItHook = ItHookCallbackMode | ItHookRegularMode |
  ItHookObservableMode | ItHookSubscriberMode | ItHookEEMode;
