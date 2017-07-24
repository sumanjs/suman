import { ISuman } from "../../dts/suman";
import { ITestSuite } from "../../dts/test-suite";
export declare const makeNotifyParent: (suman: ISuman, gracefulExit: Function, handleBeforesAndAfters: Function) => (parent: ITestSuite, child: ITestSuite, cb: Function) => void;
