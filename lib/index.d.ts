/// <reference types="node" />
import EventEmitter = NodeJS.EventEmitter;
import { Transform, Writable } from "stream";
import { IDescribeFn, IDescribeOpts, TDescribeHook } from "../dts/describe";
import { ISumanModuleExtended, TCreateHook } from "../dts/index-init";
export { IBeforeFn } from '../dts/before';
export { ITestCaseParam } from '../dts/test-suite';
export { IHookParam } from '../dts/test-suite';
export { IDescribeFn } from '../dts/describe';
export { ItFn } from '../dts/it';
import { IHookOrTestCaseParam } from "../dts/test-suite";
export interface ILoadOpts {
    path: string;
    indirect: boolean;
}
export interface Ioc {
    a: string;
    b: string;
}
export interface IIoCData {
    $pre?: Object;
    [key: string]: any;
}
export interface IInitOpts {
    export?: boolean;
    __expectedExitCode?: number;
    pre?: Array<string>;
    integrants?: Array<string>;
    series?: boolean;
    writable?: EventEmitter;
    timeout?: number;
    post?: Array<any>;
    interface?: string;
    iocData?: IIoCData;
    ioc?: Object;
}
export interface IStartCreate {
    (desc: string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TCreateHook): void;
    delay?: IDescribeFn;
    skip?: IDescribeFn;
    only?: IDescribeFn;
}
export interface IInit {
    (module: ISumanModuleExtended, opts?: IInitOpts, confOverride?: any): IStartCreate;
    $ingletonian?: any;
    tooLate?: boolean;
}
export declare const init: IInit;
export declare function SumanWritable(type: any): Writable;
export declare function SumanTransform(): Transform;
export declare const autoPass: (t: IHookOrTestCaseParam) => void;
export declare const autoFail: (t: IHookOrTestCaseParam) => Promise<never>;
export declare const once: (fn: Function) => (cb: Function) => void;
export declare const load: (opts: ILoadOpts) => any;
declare const $exports: any;
export default $exports;
