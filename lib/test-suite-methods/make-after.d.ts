import { ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
declare namespace after {
    interface IAfterFn {
        (desc: string, opts: IAfterOpts, fn: Function): void;
        cb?: IAfterFn;
        skip?: IAfterFn;
    }
    interface IAfterOpts {
        __preParsed?: boolean;
        skip: boolean;
        timeout: number;
        fatal: boolean;
        cb: boolean;
        throws: RegExp;
        plan: number;
        last: boolean;
        always: boolean;
    }
    interface IAfterHook {
    }
    type AfterHookCallbackMode = (h: IAfterHook) => void;
    type AfterHookRegularMode = (h: IAfterHook | undefined) => Promise<any>;
}
declare function after(suman: ISuman, zuite: ITestSuite): after.IAfterFn;
export = after;
