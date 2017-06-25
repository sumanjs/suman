import { ITestSuite } from "../dts/test-suite";
import { ISuman } from "../dts/suman";
import { IInjectionDeps } from "../dts/injection";
export default function (suman: ISuman): (suite: ITestSuite, parentSuite: ITestSuite, depsObj: IInjectionDeps) => any[];
