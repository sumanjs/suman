import { ITestSuite } from "suman-types/dts/test-suite";
import { IInjectionDeps } from "suman-types/dts/injection";
export declare const makeBlockInjector: (suman: any, container: Object) => (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps) => any[];
