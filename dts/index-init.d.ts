

interface IInitOpts {
  export?: boolean,
  __expectedExitCode?: number,
  pre?: Array<string>,
  integrants?: Array<string>,
  series?:boolean,
  writable?: boolean,
  timeout?: number,
  post?: Array<any>,
  interface?: string,
  iocData?:Object,
  ioc?: Object

}


interface IIntegrantsMessage {
  data: string,
  info: string,
  val: string
}


interface IStartCreate {
  (desc:string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TCreateHook): void,
  delay?: IDescribeFn,
  skip?: IDescribeFn,
  only?: IDescribeFn

}

interface ICreateOpts {

}


type TCreateHook = (...args: any[]) => void;


interface ISumanModuleExtended extends NodeModule {
  testSuiteQueue?: Array<Function>,
  _sumanInitted: boolean
}

interface IInit {
  (module: NodeModule, opts: IInitOpts): void,
  $ingletonian?: any,
  tooLate?: boolean

}
