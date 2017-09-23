import { IPseudoError } from "suman-types/dts/global";
import { ISuman } from "suman-types/dts/suman";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeHandleTestResults: (suman: ISuman) => (err: IPseudoError, test: ITestDataObj) => string | Error;
