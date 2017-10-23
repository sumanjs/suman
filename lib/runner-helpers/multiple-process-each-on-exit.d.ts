import { ISumanCPMessages } from "./handle-multiple-processes";
import { IGanttData } from "./socket-cp-hash";
export declare const makeOnExitFn: (runnerObj: any, tableRows: any, messages: ISumanCPMessages[], forkedCPs: any[], beforeExitRunOncePost: Function, makeExit: Function, runQueue: any) => (n: any, gd: IGanttData, cb: Function) => (code: number, signal: number) => void;
