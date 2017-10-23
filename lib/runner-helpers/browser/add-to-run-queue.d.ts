import { IGanttData } from "../socket-cp-hash";
export declare const makeAddToRunQueue: (runnerObj: Object, args: string[], runQueue: any, projectRoot: string, cpHash: Object, forkedCPs: any[], onExitFn: Function) => (file: string, shortFile: string, stdout: string, gd: IGanttData) => void;
