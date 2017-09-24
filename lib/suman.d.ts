import { ITestSuite } from "suman-types/dts/test-suite";
import { ISumanConfig } from "suman-types/dts/global";
import { ISumanInputs } from "suman-types/dts/suman";
import { ITestDataObj } from "suman-types/dts/it";
export declare class Suman {
    interface: string;
    $inject: Object;
    testBlockMethodCache: Object;
    iocData: Object;
    fileName: string;
    slicedFileName: string;
    timestamp: number;
    sumanId: number;
    allDescribeBlocks: Array<ITestSuite>;
    describeOnlyIsTriggered: boolean;
    deps: Array<string>;
    usingLiveSumanServer: boolean;
    numHooksSkipped: number;
    numHooksStubbed: number;
    numBlocksSkipped: number;
    rootSuiteDescription: string;
    dateSuiteFinished: number;
    dateSuiteStarted: number;
    constructor(obj: ISumanInputs);
    getTableData(): void;
    logFinished($exitCode: number, skippedString: string, cb: Function): void;
    logResult(test: ITestDataObj): void;
}
export declare const makeSuman: ($module: NodeModule, _interface: string, shouldCreateResultsDir: boolean, config: ISumanConfig) => Suman;
