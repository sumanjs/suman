import { IRunnerObj, ISumanChildProcess, ITableRows } from "../../dts/runner";
export interface ISumanCPMessages {
    code: number;
    signal: any;
}
export default function (runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>, handleMessage: Function, beforeExitRunOncePost: Function, makeExit: Function): Function;
