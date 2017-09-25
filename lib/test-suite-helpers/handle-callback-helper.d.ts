import { IAssertObj, IHookObj, ITimerObj } from "suman-types/dts/test-suite";
import { IPseudoError, ISumanDomain } from "suman-types/dts/global";
import { ITestDataObj } from "suman-types/dts/it";
export declare const makeCallback: (d: ISumanDomain, assertCount: IAssertObj, test: ITestDataObj, hook: IHookObj, timerObj: ITimerObj, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout?: boolean) => void;
