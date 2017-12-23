/// <reference types="node" />
import { IPseudoError } from "suman-types/dts/global";
import { VamootProxy } from "vamoot";
import { IHookOrTestCaseParam } from "suman-types/dts/params";
import { ITimerObj } from "suman-types/dts/general";
import EE = require('events');
import * as chai from 'chai';
export declare class ParamBase extends EE implements IHookOrTestCaseParam {
    protected __timerObj: ITimerObj;
    protected onTimeout: Function;
    protected __handle: Function;
    protected __shared: VamootProxy;
    protected __fini: Function;
    callbackMode?: boolean;
    assert: typeof chai.assert;
    should: typeof chai.should;
    expect: typeof chai.expect;
    constructor();
    timeout(val: number): any;
    done(): void;
    skip(): void;
    fatal(err: IPseudoError): void;
    set(k: string, v: any): boolean;
    get(k?: string): any;
    getValues(...args: Array<string>): any[];
    getMap(...args: Array<string>): any;
    wrap(fn: Function): () => any;
    wrapFinal(fn: Function): () => void;
    final(fn: Function): void;
    log(...args: Array<string>): void;
    slow(): void;
    wrapFinalErrorFirst(fn: Function): (err: Error) => any;
    wrapErrorFirst(fn: Function): (err: IPseudoError) => any;
    handleAssertions(fn: Function): any;
    handlePossibleError(err: Error | IPseudoError): void;
    handleNonCallbackMode(err: IPseudoError): void;
    throw(str: any): void;
}
export interface ParamBase {
    pass: typeof ParamBase.prototype.done;
    ctn: typeof ParamBase.prototype.done;
    fail: typeof ParamBase.prototype.done;
    wrapFinalErrFirst: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapFinalErr: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapFinalError: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapErrFirst: typeof ParamBase.prototype.wrapErrorFirst;
}
