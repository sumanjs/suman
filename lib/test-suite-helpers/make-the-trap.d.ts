import { ITestDataObj, ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
export declare const makeTheTrap: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, opts: any, cb: Function) => any;
