/// <reference types="node" />
import { ISumanConfig } from "../dts/global";
import EventEmitter = NodeJS.EventEmitter;
import { Transform, Writable } from "stream";
import { IDescribeFn, IDescribeOpts, TDescribeHook } from "../dts/describe";
import { ISumanModuleExtended, TCreateHook } from "../dts/index-init";
import { IHookOrTestCaseParam } from "../dts/test-suite";
export declare type TConfigOverride = Partial<ISumanConfig>;
export { ITestCaseParam } from '../dts/test-suite';
export { IHookParam } from '../dts/test-suite';
export { IDescribeFn } from '../dts/describe';
export { ItFn } from '../dts/it';
export { IBeforeFn } from '../dts/before';
export { IBeforeEachFn } from '../dts/before-each';
export { IAfterFn } from '../dts/after';
export { IAfterEachFn } from '../dts/after-each';
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
    (module: ISumanModuleExtended, opts?: IInitOpts, confOverride?: TConfigOverride): IStartCreate;
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
