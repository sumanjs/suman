import { IAssertObj, IHookObj, ITestDataObj, ITimerObj } from "../../dts/test-suite";
import { IPseudoError, ISumanDomain } from "../../dts/global";
declare var _default: (d: ISumanDomain, assertCount: IAssertObj, test: ITestDataObj, hook: IHookObj, timerObj: ITimerObj, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout: boolean) => void;
export = _default;
