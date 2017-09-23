import { ITestDataObj } from "../../dts/it";
import { IHandleError, ITestCaseParam } from "../../dts/test-suite";
export interface IAssertCount {
    num: number;
}
export declare const makeTestCase: (test: ITestDataObj, assertCount: IAssertCount, handleError: IHandleError) => ITestCaseParam;
