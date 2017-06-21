import { IAssertObj, IHandleError, IHookObj } from "../dts/test-suite";
export declare const makeHookObj: (hook: IHookObj, assertCount: IAssertObj) => (handleError: IHandleError) => void;
