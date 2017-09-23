import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
import { IItOpts, ITestDataObj } from "suman-types/dts/it";
export declare const makeTheTrap: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, opts: IItOpts, cb: Function) => any;
