import { IEachHookObj, ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
export declare const makeHandleBeforeOrAfterEach: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: any, aBeforeOrAfterEach: IEachHookObj, cb: Function) => any;
