import { IOnceHookObj } from "dts/test-suite";
import { ISuman } from "../../dts/suman";
export declare const makeHandleBeforesAndAfters: (suman: ISuman, gracefulExit: Function) => (aBeforeOrAfter: IOnceHookObj, cb: Function) => void;
