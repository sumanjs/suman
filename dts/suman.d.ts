import EventEmitter = NodeJS.EventEmitter;
import {ITestSuite} from "./test-suite";


export interface ISumanGlobalInternal {
  // defintion for global.__suman
}


export interface ISuman {

  filename: string,
  numHooksSkipped: number,
  numHooksStubbed: number,
  describeOnlyIsTriggered: boolean,
  itOnlyIsTriggered: boolean,
  allDescribeBlocks: Array<ITestSuite>,
  interface: string,
  numBlocksSkipped: number,
  logFinished: Function,
  extraArgs: Array<string>
  sumanCompleted: boolean,
  slicedFileName: string,
  desc: string,
  rootSuiteDescription: string,
  deps: string,
  dateSuiteStarted: number,
  dateSuiteFinished: number
  logResult: () => void

}


