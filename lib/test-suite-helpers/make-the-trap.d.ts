import { ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
import { IItOpts, ITestDataObj } from "../../dts/it";
export declare const makeTheTrap: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: ITestDataObj, opts: IItOpts, cb: Function) => any;
