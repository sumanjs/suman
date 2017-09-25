import { IPseudoError } from "suman-types/dts/global";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeHandleTestResults: (suman: any) => (err: IPseudoError, test: ITestDataObj) => string | Error;
