import { IInjectFn } from "suman-types/dts/inject";
import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
export declare const makeInject: (suman: Suman, zuite: ITestSuite) => IInjectFn;
