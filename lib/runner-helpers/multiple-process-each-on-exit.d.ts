import { IRunnerObj, ISumanChildProcess, ITableRows } from "suman-types/dts/runner";
import { ISumanCPMessages } from "./handle-multiple-processes";
import { IGanttData } from "./socket-cp-hash";
export declare const makeOnExitFn: (runnerObj: IRunnerObj, tableRows: ITableRows, messages: ISumanCPMessages[], forkedCPs: ISumanChildProcess[], beforeExitRunOncePost: Function, makeExit: Function, gd: IGanttData, transpileQueue: any) => (n: ISumanChildProcess) => (code: number, signal: number) => void;
