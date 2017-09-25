import { IEachHookObj, ITestSuite } from "suman-types/dts/test-suite";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeHandleBeforeOrAfterEach: (suman: any, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, aBeforeOrAfterEach: IEachHookObj, cb: Function) => any;
