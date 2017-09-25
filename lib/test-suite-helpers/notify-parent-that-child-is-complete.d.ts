import { Suman } from "../suman";
import { ITestSuite } from "suman-types/dts/test-suite";
export declare const makeNotifyParent: (suman: Suman, gracefulExit: Function, handleBeforesAndAfters: Function) => (parent: ITestSuite, child: ITestSuite, cb: Function) => any;
