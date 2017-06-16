import { IPseudoError } from "../../dts/global";
import { ITestDataObj } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
declare const _default: (suman: ISuman) => (err: IPseudoError, test: ITestDataObj) => string | Error;
export = _default;
