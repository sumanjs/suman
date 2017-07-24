import { ISumanErrorFirstCB } from "./index";
export interface IOncePostModuleRetDependencies {
    [key: string]: Function;
}
export interface IOncePostModuleRet {
    dependencies: IOncePostModuleRetDependencies;
}
export declare const run: ($oncePostKeys: string[], userDataObj: any, cb: ISumanErrorFirstCB) => void;
declare const $exports: any;
export default $exports;
