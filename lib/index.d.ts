/// <reference types="node" />
import EventEmitter = NodeJS.EventEmitter;
import { Transform, Writable } from "stream";
import { IDescribeFn, IDescribeOpts, TDescribeHook } from "../dts/describe";
import { ISumanModuleExtended, TCreateHook } from "../dts/index-init";
export interface ILoadOpts {
    path: string;
    indirect: boolean;
}
export interface Ioc {
    a: string;
    b: string;
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
    iocData?: Object;
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
export declare function autoPass(): void;
export declare function autoFail(): void;
export declare function once(fn: Function): (cb: Function) => void;
export declare function load(opts: ILoadOpts): any;
