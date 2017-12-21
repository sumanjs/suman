/// <reference types="node" />
import { IPseudoError } from "suman-types/dts/global";
import { IHookObj } from "suman-types/dts/test-suite";
import EE = require('events');
export interface IParamBase {
}
export declare class ParamBase implements IParamBase {
    protected __hook: IHookObj;
    done: Function;
    constructor();
    skip(): void;
    fatal(err: IPseudoError): void;
    set(k: string, v: any): any;
    get(k?: string): any;
    getValues(...args: Array<string>): any[];
    getMap(...args: Array<string>): any;
    wrap(fn: Function): () => any;
    wrapFinal(fn: Function): () => void;
    final(fn: Function): void;
    log(...args: Array<string>): void;
    slow(): void;
}
export declare const tProto: ParamBase & Function & EE;
