export interface ISumanCPMessages {
    code: number;
    signal: any;
}
export declare const makeHandleBrowserProcesses: (runnerObj: any, tableRows: any, messages: ISumanCPMessages[], forkedCPs: any[], beforeExitRunOncePost: Function, makeExit: Function) => Function;
