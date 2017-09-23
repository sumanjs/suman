import { IEachHookObj, ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeHandleBeforeOrAfterEach: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, aBeforeOrAfterEach: IEachHookObj, cb: Function) => any;
