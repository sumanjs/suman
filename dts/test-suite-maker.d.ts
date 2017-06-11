
import {ITestSuite} from "./test-suite";

export type TTestSuiteMaker = (data: any) => ITestSuite;

export interface ITestSuiteMakerOpts {
    desc: string,
    title: string,
    opts: Object
}

