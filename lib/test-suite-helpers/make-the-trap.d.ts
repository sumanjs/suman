import { ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
import { IItOpts } from "../../dts/it";
export declare const makeTheTrap: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: any, opts: IItOpts, cb: Function) => any;
