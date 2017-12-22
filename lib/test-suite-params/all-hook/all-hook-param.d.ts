import { IAssertObj, IHandleError, IHookObj } from 'suman-types/dts/test-suite';
import { IAllHookParam } from 'suman-types/dts/params';
import { ParamBase } from '../base';
export declare class AllHookParam extends ParamBase implements IAllHookParam {
    protected __planCalled: boolean;
    protected __assertCount: IAssertObj;
    protected planCountExpected: number;
    constructor(hook: IHookObj, assertCount: IAssertObj, handleError: IHandleError, fini: Function);
    plan(num: number): any;
    confirm(): void;
}
