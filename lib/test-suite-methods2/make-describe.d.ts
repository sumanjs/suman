import { Suman } from "../suman";
import { IDescribeFn } from "suman-types/dts/describe";
export declare const makeDescribe: (suman: Suman, gracefulExit: Function, TestBlock: any, notifyParentThatChildIsComplete: Function, blockInjector: Function) => IDescribeFn;
