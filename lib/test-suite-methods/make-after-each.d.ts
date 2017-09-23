import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
import { IAfterEachFn } from "suman-types/dts/after-each";
export declare const makeAfterEach: (suman: ISuman, zuite: ITestSuite) => IAfterEachFn;
