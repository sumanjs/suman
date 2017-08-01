import { IRunnerObj, ISumanChildProcess, ITableRows } from "../../dts/runner";
import { ISumanCPMessages } from "./handle-multiple-processes";
import { IGanttData } from "./socket-cp-hash";
export default function (n: ISumanChildProcess, runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>, beforeExitRunOncePost: Function, makeExit: Function, gd: IGanttData): (code: number, signal: number) => void;
