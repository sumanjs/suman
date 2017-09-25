import { ITestSuite } from "suman-types/dts/test-suite";
import { IBeforeEachObj } from "suman-types/dts/before-each";
import { IAFterEachObj } from "suman-types/dts/after-each";
export declare const getAllBeforesEaches: (zuite: ITestSuite) => IBeforeEachObj[];
export declare const getAllAfterEaches: (zuite: ITestSuite) => IAFterEachObj[];
