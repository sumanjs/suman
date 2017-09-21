import { IAssertObj, IHookObj, ITimerObj } from "../../dts/test-suite";
import { IPseudoError, ISumanDomain } from "../../dts/global";
import { ITestDataObj } from "../../dts/it";
export declare const makeCallback: (d: ISumanDomain, assertCount: IAssertObj, test: ITestDataObj, hook: IHookObj, timerObj: ITimerObj, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout?: boolean) => void;
