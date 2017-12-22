import { IAssertObj, IHandleError, IHookObj } from 'suman-types/dts/test-suite';
import { IInjectHookParam } from 'suman-types/dts/params';
import { ITestSuite } from 'suman-types/dts/test-suite';
import { Dictionary } from 'async';
import { ParamBase } from '../base';
export interface IValuesMap {
    [key: string]: true;
}
export declare class InjectParam extends ParamBase implements IInjectHookParam {
    protected __planCalled: boolean;
    protected __valuesMap: IValuesMap;
    protected __suite: ITestSuite;
    protected __values: Array<any>;
    protected __inject: IHookObj;
    protected __assertCount: IAssertObj;
    planCountExpected: number;
    constructor(inject: IHookObj, assertCount: IAssertObj, suite: ITestSuite, values: Array<any>, handleError: IHandleError, fini: Function);
    registerKey(k: string, val: any): Promise<any>;
    registerFnMap(o: Dictionary<any>): Promise<any>;
    registerMap(o: Dictionary<any>): Promise<Array<any>>;
    plan(num: number): any;
    confirm(): void;
}
