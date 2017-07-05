///<reference path="../node_modules/@types/node/index.d.ts"/>

import {ChildProcess} from "child_process";
import Timer = NodeJS.Timer;
import {IDefaultTableData, ITableData} from "./table-data";


export interface ISumanChildProcess extends ChildProcess {
  dateStartedMillis: number,
  dateEndedMillis: number,
  shortTestPath: string,
  testPath: string,
  expectedExitCode: number,
  tapOutputIsComplete: boolean,
  to: Timer,
  fileName: string,
  filename: string
}

export interface IRunObj {
  files: Array<string>
  filesThatDidNotMatch: Array<string>
}

export interface IRunnerRunFn {
  (): void,
  shortTestPath: string,
  testPath: string,
  tableData: ITableData,
  defaultTableData: IDefaultTableData
}


export interface ITableRowsValue {
  tableData: Object,
  actualExitCode: number,
  shortFilePath: string,
  defaultTableData: IDefaultTableData
}

export interface ITableRows {
 [key: string]: ITableRowsValue

}

export interface IHandleBlocking {
  runNext: Function,
  releaseNextTests: Function,
  determineInitialStarters: Function,
  getStartedAndEnded: Function,
  shouldFileBeBlockedAtStart: Function
}


export interface IRunnerObj {
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
