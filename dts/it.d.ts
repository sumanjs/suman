interface ItFn {
  (desc: string, opts: IItOpts, fn: Function): void,
  skip?: ItFn,
  only?: ItFn,
  cb?: ItFn
}


interface IRawTestData {
  //empty
}

interface IItOpts {
  __preParsed: boolean,
  parallel: boolean,
  series: boolean,
  serial: boolean,
  mode: string,
  delay: number
}

interface It {

}


type ItHookCallbackMode = (t: It) => void;
type ItHookRegularMode = (h?: It | undefined) => Promise<any>;
