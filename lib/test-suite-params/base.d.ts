import { IPseudoError } from "suman-types/dts/global";
import { IHookObj } from "suman-types/dts/test-suite";
export declare class ParamBase {
    protected __hook: IHookObj;
    constructor();
    done(): void;
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
    wrapFinalErrorFirst(fn: Function): (err: Error) => any;
    wrapErrorFirst(fn: Function): (err: IPseudoError) => any;
    handleAssertions(fn: Function): any;
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
