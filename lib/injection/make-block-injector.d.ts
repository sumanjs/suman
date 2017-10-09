import { ITestSuite } from "suman-types/dts/test-suite";
import { IInjectionDeps } from "suman-types/dts/injection";
import { Suman } from "../suman";
export declare const makeBlockInjector: (suman: Suman, container: Object) => (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps) => any[];
