import { IBeforeFn } from "suman-types/dts/before";
import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
export declare const makeBefore: (suman: ISuman, zuite: ITestSuite) => IBeforeFn;
