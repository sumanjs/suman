import { IHookObj } from "suman-types/dts/test-suite";
import { IPseudoError, ISumanDomain } from "suman-types/dts/global";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeAllHookCallback: (d: ISumanDomain, assertCount: any, hook: IHookObj, timerObj: any, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout?: boolean) => any;
export declare const makeEachHookCallback: (d: ISumanDomain, assertCount: any, hook: IHookObj, timerObj: any, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout?: boolean) => void;
export declare const makeTestCaseCallback: (d: ISumanDomain, assertCount: any, test: ITestDataObj, timerObj: any, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout?: boolean) => any;
