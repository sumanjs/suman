import { ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
import { TTestSuiteMaker } from "../../dts/test-suite-maker";
import { IDescribeFn } from "../../dts/describe";
export declare const makeDescribe: (suman: ISuman, gracefulExit: Function, TestSuiteMaker: TTestSuiteMaker, zuite: ITestSuite, notifyParentThatChildIsComplete: Function) => IDescribeFn;
