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
  __preParsed: boolean

}

interface It {

}


type ItHookCallbackMode = (t: It) => void;
type ItHookRegularMode = (h?: It | undefined) => Promise<any>;
