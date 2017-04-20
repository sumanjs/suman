import EventEmitter = NodeJS.EventEmitter;


interface ISumanGlobalInternal {
  // defintion for global.__suman
}


interface ISuman {

  filename: string,
  numHooksSkipped: number,
  numHooksStubbed: number,
  describeOnlyIsTriggered: boolean,
  itOnlyIsTriggered: boolean,
  allDescribeBlocks: Array<ITestSuite>,
  interface: string,
  numBlocksSkipped: number,
  _sumanModulePath: string,
  logFinished: Function,
  _sumanEvents: EventEmitter,
  extraArgs: Array<string>
  sumanCompleted: boolean,
  slicedFileName: string,
  desc: string,
  rootSuiteDescription: string,
  deps: string,
  dateSuiteStarted: number,  // this is a number, not a Date,
  dateSuiteFinished: number
  logResult: () => void

}


