import { IPseudoError } from "../../dts/global";
import { ISuman } from "../../dts/suman";
import { ITestDataObj } from "../../dts/it";
export declare const makeHandleTestResults: (suman: ISuman) => (err: IPseudoError, test: ITestDataObj) => string | Error;
