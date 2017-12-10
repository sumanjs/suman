import { ISumanDomain } from "suman-types/dts/global";
import { ITestDataObj } from "suman-types/dts/it";
import { IHookObj } from "suman-types/dts/test-suite";
export declare const handleReturnVal: (done: Function, str: string, testOrHook: IHookObj | ITestDataObj) => (val: any, warn: boolean, d: ISumanDomain) => void;
export declare const handleGenerator: (fn: Function, args: any[]) => any;
