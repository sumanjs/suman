

export interface IIntegrantsMessage {
  data: string,
  info: string,
  val: string
}


export interface ICreateOpts {
  delay: boolean,
  skip: boolean,
  only: boolean
}

export type TCreateHook = (...args: any[]) => void;


export interface ISumanModuleExtended extends NodeModule {
  testSuiteQueue?: Array<Function>,
  sumanInitted?: boolean
}


