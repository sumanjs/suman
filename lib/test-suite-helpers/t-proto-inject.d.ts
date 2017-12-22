import { IAssertObj, IHandleError, IHookObj } from "suman-types/dts/test-suite";
import { ITestSuite } from 'suman-types/dts/test-suite';
export declare const makeInjectParam: (inject: IHookObj, assertCount: IAssertObj, suite: ITestSuite, values: any[], handleError: IHandleError, fini: Function) => any;
