import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { IBeforeEachFn } from "suman-types/dts/before-each";
export declare const makeBeforeEach: (suman: Suman, zuite: ITestSuite) => IBeforeEachFn;
