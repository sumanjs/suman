// after

export interface IAfterFn {
  (desc: string, opts: IAfterOpts, fn: Function): void,
  cb?: IAfterFn,
  skip?: IAfterFn
}

export interface IAfterOpts {
  __preParsed?: boolean,
  skip: boolean,
  timeout: number,
  fatal: boolean,
  cb: boolean,
  throws: RegExp,
  plan: number
}


export interface IAfterHook {

}

export type AfterHookCallbackMode = (h: IAfterHook) => void;
export type AfterHookRegularMode = (h: IAfterHook | undefined) => Promise<any>;
