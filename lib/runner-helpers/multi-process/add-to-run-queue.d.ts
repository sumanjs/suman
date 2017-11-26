import { IGanttData } from "../socket-cp-hash";
import { IRunnerObj } from "suman-types/dts/runner";
export declare const makeAddToRunQueue: (runnerObj: IRunnerObj, args: string[], runQueue: any, projectRoot: string, cpHash: Object, forkedCPs: any[], onExitFn: Function) => (file: string, shortFile: string, stdout: string, gd: IGanttData) => void;
