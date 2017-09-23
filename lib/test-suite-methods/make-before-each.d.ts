import { ITestSuite } from "suman-types/dts/test-suite";
import { ISuman } from "suman-types/dts/suman";
import { IBeforeEachFn } from "suman-types/dts/before-each";
export declare const makeBeforeEach: (suman: ISuman, zuite: ITestSuite) => IBeforeEachFn;
