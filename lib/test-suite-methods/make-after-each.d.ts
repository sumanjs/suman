import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { IAfterEachFn } from "suman-types/dts/after-each";
export declare const makeAfterEach: (suman: Suman, zuite: ITestSuite) => IAfterEachFn;
