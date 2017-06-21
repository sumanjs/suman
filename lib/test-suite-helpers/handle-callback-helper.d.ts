import { IAssertObj, IHookObj, ITimerObj } from "../../dts/test-suite";
import { IPseudoError, ISumanDomain } from "../../dts/global";
declare const _default: (d: ISumanDomain, assertCount: IAssertObj, test: any, hook: IHookObj, timerObj: ITimerObj, gracefulExit: Function, cb: Function) => (err: IPseudoError, isTimeout: boolean) => void;
export = _default;
