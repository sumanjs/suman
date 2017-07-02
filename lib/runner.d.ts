export interface IIntegrantHash {
    [key: string]: any;
}
export interface IOncePost {
    [key: string]: Function | Array<string | Function>;
}
export declare type TOncePostKeys = Array<Array<string>>;
export declare const findTestsAndRunThem: (runObj: Object, runOnce: Function, $order: Object) => void;
declare const $exports: any;
export default $exports;
