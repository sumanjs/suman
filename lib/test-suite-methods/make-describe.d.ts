import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { IDescribeFn } from "suman-types/dts/describe";
export declare const makeDescribe: (suman: Suman, gracefulExit: Function, TestBlock: any, zuite: ITestSuite, notifyParentThatChildIsComplete: Function, blockInjector: Function) => IDescribeFn;
