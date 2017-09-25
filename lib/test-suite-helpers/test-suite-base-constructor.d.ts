import { ITestSuiteBaseInitObj } from "suman-types/dts/test-suite";
import { ISuman } from "../suman";
export declare class TestSuiteBase {
    opts: Object;
    testId: number;
    isSetupComplete: boolean;
    parallel: boolean;
    skipped: boolean;
    only: boolean;
    filename: string;
    getAfterAllParentHooks: Function;
    private mergeAfters;
    private getAfters;
    private getAfterEaches;
    private getBefores;
    private getBeforeEaches;
    private injectedValues;
    private getInjectedValue;
    private getInjections;
    private getChildren;
    private getTests;
    private getParallelTests;
    private getTestsParallel;
    private getLoopTests;
    private getAftersLast;
    constructor(obj: ITestSuiteBaseInitObj, suman: ISuman);
}
