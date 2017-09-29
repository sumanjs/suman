import { Suman } from "../suman";
import { ITestSuite } from "suman-types/dts/test-suite";
export declare const areAllChildBlocksCompleted: (block: ITestSuite) => boolean;
export declare const makeNotifyParent: (suman: Suman, gracefulExit: Function, handleBeforesAndAfters: Function) => (child: ITestSuite, cb: Function) => any;
