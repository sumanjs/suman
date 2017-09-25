import { IBeforeFn } from "suman-types/dts/before";
import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
export declare const makeBefore: (suman: Suman, zuite: ITestSuite) => IBeforeFn;
