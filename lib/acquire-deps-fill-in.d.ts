import { ITestSuite } from "../dts/test-suite";
import { ISuman } from "../dts/suman";
import { IInjectionDeps } from "../dts/injection";
declare const _default: (suman: ISuman) => (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps) => any[];
export = _default;
