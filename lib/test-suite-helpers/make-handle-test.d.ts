import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
export declare const makeHandleTest: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: any, cb: Function) => any;
