import { ISuman } from "suman-types/dts/suman";
import { ITestSuite } from "suman-types/dts/test-suite";
export declare const makeNotifyParent: (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) => (parent: ITestSuite, child: ITestSuite, cb: Function) => void;
