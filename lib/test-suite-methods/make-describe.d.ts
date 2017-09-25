import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { TTestSuiteMaker } from "suman-types/dts/test-suite-maker";
import { IDescribeFn } from "suman-types/dts/describe";
export declare const makeDescribe: (suman: Suman, gracefulExit: Function, TestSuiteMaker: TTestSuiteMaker, zuite: ITestSuite, notifyParentThatChildIsComplete: Function, blockInjector: Function) => IDescribeFn;
