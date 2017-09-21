export interface IOncePostModuleRetDependencies {
    [key: string]: Function;
}
export interface IOncePostModuleRet {
    dependencies: IOncePostModuleRetDependencies;
}
export declare const run: ($oncePostKeys: string[], userDataObj: any, cb: any) => any;
declare const $exports: any;
export default $exports;
