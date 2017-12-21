import { ITestDataObj } from 'suman-types/dts/it';
import { IHandleError } from 'suman-types/dts/test-suite';
import { ParamBase } from '../base';
export interface IAssertCount {
    num: number;
}
export declare class TestCaseParam extends ParamBase {
    constructor(test: ITestDataObj, assertCount: IAssertCount, handleError: IHandleError, fini: Function);
    plan(num: number): void;
    confirm(): void;
}
