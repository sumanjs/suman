import { IPseudoError } from "suman-types/dts/global";
import { Suman } from "../suman";
export interface ICloneErrorFn {
    (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError;
}
export declare const handleSetupComplete: (test: any, type: string) => void;
export declare const extractVals: (val: any) => {
    timeout: number;
    subDeps: string[];
    fn: Function;
    props: string[];
};
export declare const makeHandleAsyncReporters: (reporterRets: any[]) => (cb: Function) => any;
export declare const makeRunGenerator: (fn: Function, ctx: any) => () => Promise<any>;
export declare const asyncHelper: (key: string, resolve: Function, reject: Function, $args: any[], ln: number, fn: Function) => any;
export declare const implementationError: (err: any, isThrow: boolean) => void;
export declare const loadSumanConfig: (configPath: string, opts: Object) => any;
export declare const resolveSharedDirs: (sumanConfig: any, projectRoot: string, sumanOpts: any) => any;
export declare const loadSharedObjects: (pathObj: Object, projectRoot: string, sumanOpts: any) => any;
export declare const vetPaths: (paths: string[]) => void;
export declare const fatalRequestReply: (obj: Object, $cb: Function) => any;
export declare const findSumanServer: (serverName?: string) => any;
export declare const makeOnSumanCompleted: (suman: Suman) => (code: number, msg: string) => void;
export declare const cloneError: ICloneErrorFn;
export declare const parseArgs: (args: any[], fnIsRequired?: boolean) => {
    arrayDeps: any[];
    args: any[];
};
export declare const evalOptions: (arrayDeps: any[], opts: any) => void;
