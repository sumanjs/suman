/// <reference types="node" />
import { ITestSuite } from "../dts/test-suite";
import { ISumanConfig } from "../dts/global";
import { ISumanServerInfo } from './helpers/find-suman-server';
import { ITestDataObj } from "../dts/it";
export interface ITableDataCallbackObj {
    exitCode: number;
    tableData: Object;
}
export interface ISumanInputs {
    interface: string;
    fileName: string;
    timestamp: number;
    usingLiveSumanServer: boolean;
    server: ISumanServerInfo;
}
export declare class Suman {
    interface: string;
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
    $inject: Object;
    constructor(obj: ISumanInputs);
    getTableData(): void;
    logFinished($exitCode: number, skippedString: string, cb: Function): void;
    logResult(test: ITestDataObj): void;
}
export declare const makeSuman: ($module: NodeModule, _interface: string, shouldCreateResultsDir: boolean, config: ISumanConfig) => Suman;
