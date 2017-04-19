

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
  delay: boolean,
  skip: boolean,
  only: boolean
}


type TCreateHook = (...args: any[]) => void;


interface ISumanModuleExtended extends NodeModule {
  testSuiteQueue?: Array<Function>,
  _sumanInitted: boolean
}


