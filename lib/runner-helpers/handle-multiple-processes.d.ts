import { IRunnerObj, ISumanChildProcess, ITableRows } from "../../dts/runner";
export interface ISumanCPMessages {
    code: number;
    signal: any;
}
export declare const makeHandleMultipleProcesses: (runnerObj: IRunnerObj, tableRows: ITableRows, messages: ISumanCPMessages[], forkedCPs: ISumanChildProcess[], handleMessage: Function, beforeExitRunOncePost: Function, makeExit: Function) => Function;
