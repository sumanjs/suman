import { ISuman } from "suman-types/dts/suman";
import { IPseudoError } from "suman-types/dts/global";
export declare const makeGracefulExit: (suman: ISuman) => ($errs: any[] | Error | IPseudoError, cb: Function) => any;
