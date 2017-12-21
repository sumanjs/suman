import { ITestDataObj } from "suman-types/dts/it";
import { IHandleError, ITestCaseParam } from "suman-types/dts/test-suite";
export interface IAssertCount {
    num: number;
}
export declare const makeTestCaseParam: (test: ITestDataObj, assertCount: IAssertCount, handleError: IHandleError, fini: Function) => ITestCaseParam;
