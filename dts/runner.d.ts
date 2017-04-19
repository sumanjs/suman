

import {ChildProcess} from "child_process";

interface ISumanChildProcess extends ChildProcess {
  shortTestPath: string,
  testPath: string,
  expectedExitCode: number,
  tapOutputIsComplete: boolean,
  to: Timer,
  fileName: string,
  filename: string
}

interface IRunObj {
  files: Array<string>
  filesThatDidNotMatch: Array<string>
}

interface IRunnerRunFn {
  (): void,
  shortTestPath: string,
  testPath: string,
  tableData: ITableData,
  defaultTableData: IDefaultTableData
}


interface ITableRowsValue {
  tableData: Object,
  actualExitCode: number,
  shortFilePath: string
}

interface ITableRows {
 [key: string]: ITableRowsValue

}

interface IHandleBlocking {
  releaseNextTests: Function,
  determineInitialStarters: Function,
  getStartedAndEnded: Function,
  shouldFileBeBlockedAtStart: Function
}


interface IRunnerObj {
  doneCount: number,
  tableCount: number,
  listening: boolean,
  processId: number,
  startTime: number,
  endTime: number,
  bailed: boolean,
  queuedCPs: Array<IRunnerRunFn>,
  hasOncePostFile: boolean,
  innited: boolean,
  oncePostModule: null,
  oncePostModuleRet: null,
  depContainerObj: null,
  handleBlocking?: IHandleBlocking
}
