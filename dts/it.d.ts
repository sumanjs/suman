export interface ItFn {
  (desc: string, opts: IItOpts, fn: Function): void,
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

export interface It {

}


export type ItHookCallbackMode = (t: It) => void;
export type ItHookRegularMode = (h?: It | undefined) => Promise<any>;
