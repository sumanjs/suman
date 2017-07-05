import { IRunnerObj, ISumanChildProcess, ITableRows } from "../../dts/runner";
import { ISumanCPMessages } from "./handle-multiple-processes";
export default function (n: ISumanChildProcess, runnerObj: IRunnerObj, tableRows: ITableRows, messages: Array<ISumanCPMessages>, forkedCPs: Array<ISumanChildProcess>, beforeExitRunOncePost: Function, makeExit: Function): (code: number, signal: number) => void;
