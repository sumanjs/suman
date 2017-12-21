import { IAssertObj, IHandleError, IHookObj } from 'suman-types/dts/test-suite';
import { ITestSuite } from 'suman-types/dts/test-suite';
import { Dictionary } from 'async';
import { ParamBase } from '../base';
export declare class InjectParam extends ParamBase {
    constructor(inject: IHookObj, assertCount: IAssertObj, suite: ITestSuite, values: Array<any>, handleError: IHandleError, fini: Function);
    registerKey(k: string, val: any): Promise<any>;
    registerFnMap(o: Dictionary<any>): Promise<any>;
    registerMap(o: Dictionary<any>): Promise<Array<any>>;
    plan(num: number): any;
    confirm: () => void;
}
