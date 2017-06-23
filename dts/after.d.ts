// after

import {IOnceHookObj} from "./test-suite";

export interface IAfterFn {
  (desc: string, opts: IAfterOpts, fn: Function): void,
  cb?: IAfterFn,
  skip?: IAfterFn
}


export interface IAfterObj extends IOnceHookObj {
  last: boolean,
  always: boolean
}

export interface IAfterHook {

}


export interface IAfterOpts {
  __preParsed?: boolean,
  skip: boolean,
  timeout: number,
  fatal: boolean,
  cb: boolean,
  throws: RegExp,
  plan: number,
  last: boolean,
  always: boolean
}



export type AfterHookCallbackMode = (h: IAfterHook) => void;
export type AfterHookRegularMode = (h: IAfterHook | undefined) => Promise<any>;
