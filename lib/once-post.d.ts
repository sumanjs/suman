export interface IOncePostModuleRetDependencies {
    [key: string]: Function;
}
export interface IOncePostModuleRet {
    dependencies: IOncePostModuleRetDependencies;
}
export declare const run: ($oncePostKeys: string[], userDataObj: Object, cb: Function) => any;
