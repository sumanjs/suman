import { Suman } from "../suman";
import { IDescribeFn } from "suman-types/dts/describe";
import { TestBlockBase } from "../test-suite-helpers/make-test-suite";
export declare const makeDescribe: (suman: Suman, gracefulExit: Function, TestBlock: TestBlockBase, notifyParentThatChildIsComplete: Function, blockInjector: Function) => IDescribeFn;
