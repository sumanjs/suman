import { ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
export declare const makeHandleTest: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: any, cb: Function) => any;
