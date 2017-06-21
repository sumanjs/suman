import { ISuman } from "../dts/suman";
import { ICreateOpts, TCreateHook } from "../dts/index-init";
export interface IMakeCreate {
    (desc: string, opts: ICreateOpts, arr: Array<any>, cb: TCreateHook): void;
}
export declare const execSuite: (suman: ISuman) => IMakeCreate;
