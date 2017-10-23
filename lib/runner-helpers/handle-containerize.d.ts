export interface ISumanCPMessages {
    code: number;
    signal: any;
}
export declare const makeContainerize: (runnerObj: any, tableRows: any, messages: ISumanCPMessages[], forkedCPs: any[], handleMessage: Function, beforeExitRunOncePost: Function, makeExit: Function) => Function;
