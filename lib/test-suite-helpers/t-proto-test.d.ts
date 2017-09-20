import { ITestDataObj } from "../../dts/it";
export interface IAssertCount {
    num: number;
}
export declare const makeTestCase: (test: ITestDataObj, assertCount: IAssertCount) => (handleError: Function) => void;
