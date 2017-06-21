import { ITestSuiteBaseInitObj } from "../dts/test-suite";
import { ISuman } from "../dts/suman";
export default class TestSuiteBase {
    opts: Object;
    testId: number;
    isSetupComplete: boolean;
    parallel: boolean;
    skipped: boolean;
    only: boolean;
    filename: string;
    mergeAfters: Function;
    getAfters: Function;
    getAfterEaches: Function;
    getBefores: Function;
    getBeforeEaches: Function;
    injectedValues: Object;
    getInjectedValue: Function;
    getInjections: Function;
    getChildren: Function;
    getTests: Function;
    getParallelTests: Function;
    getTestsParallel: Function;
    getLoopTests: Function;
    getAftersLast: Function;
    constructor(obj: ITestSuiteBaseInitObj, suman: ISuman);
}
