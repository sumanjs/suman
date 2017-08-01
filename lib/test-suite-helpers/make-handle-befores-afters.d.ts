import { IOnceHookObj, ITestSuite } from "dts/test-suite";
import { ISuman } from "../../dts/suman";
export declare const makeHandleBeforesAndAfters: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, aBeforeOrAfter: IOnceHookObj, cb: Function) => void;
