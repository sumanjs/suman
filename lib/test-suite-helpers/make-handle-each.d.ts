import { IEachHookObj, ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
import { ITestDataObj } from "../../dts/it";
export declare const makeHandleBeforeOrAfterEach: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, aBeforeOrAfterEach: IEachHookObj, cb: Function) => any;
