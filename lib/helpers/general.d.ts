import { IPseudoError } from "suman-types/dts/global";
import { IAllOpts } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { ISumanServerInfo } from "suman-types/dts/suman";
export interface ICloneErrorFn {
    (err: Error, newMessage: string, stripAllButTestFilePathMatch?: boolean): IPseudoError;
}
export declare const fatalRequestReply: (obj: Object, $cb: Function) => any;
export declare const findSumanServer: (serverName?: string) => ISumanServerInfo;
export declare const makeOnSumanCompleted: (suman: Suman) => (code: number, msg: string) => void;
export declare const cloneError: ICloneErrorFn;
export declare const parseArgs: (args: any[], fnIsRequired?: boolean) => {
    arrayDeps: IAllOpts[];
    args: any[];
};
export declare const evalOptions: (arrayDeps: IAllOpts[], opts: IAllOpts) => void;
