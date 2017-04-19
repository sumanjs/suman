/// <reference types="node" />
declare const process: any;
declare const global: any;
declare const fs: any;
declare const path: any;
declare const domain: any;
declare const EE: any;
declare const util: any;
declare const flattenDeep: any;
declare const readline: any;
declare const colors: any;
declare const AsciiTable: any;
declare const async: any;
declare const fnArgs: any;
declare const events: any;
declare const _suman: IGlobalSumanObj;
declare const su: any;
declare const finalizeOutput: any;
declare const findSumanServer: any;
declare const constants: any;
declare const resultBroadcaster: any;
declare const weAreDebugging: any;
declare let sumanId: number;
interface ISumanInputs {
    interface: string;
    fileName: string;
    networkLog: string;
    outputPath: string;
    timestamp: string;
}
interface ITableData {
    ROOT_SUITE_NAME: string;
    SUITE_COUNT: number;
    SUITE_SKIPPED_COUNT: number;
    TEST_CASES_TOTAL: number;
    TEST_CASES_FAILED: number;
    TEST_CASES_PASSED: number;
    TEST_CASES_SKIPPED: number;
    TEST_CASES_STUBBED: number;
    TEST_FILE_MILLIS: number;
    OVERALL_DESIGNATOR: string;
}
interface IDefaultTableData {
    SUITES_DESIGNATOR: string;
}
declare function Suman(obj: ISumanInputs): void;
declare function combine(prev: number, curr: number): number;
declare function makeSuman($module: NodeModule, _interface: string, shouldCreateResultsDir: boolean, config: ISumanConfig, cb: Function): void;
