import { IAssertObj, IHandleError, IHookObj } from 'suman-types/dts/test-suite';
import { ParamBase } from '../base';
export declare class EachHookParam extends ParamBase {
    protected __planCalled: boolean;
    protected __assertCount: IAssertObj;
    protected planCountExpected: number;
    constructor(hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError, fini: Function);
    plan(num: number): any;
    confirm(): void;
}
