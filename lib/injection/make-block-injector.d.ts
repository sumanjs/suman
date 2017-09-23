import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
import { IInjectionDeps } from "suman-types/dts/injection";
export declare const makeBlockInjector: (suman: ISuman) => (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps) => any[];
