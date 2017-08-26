import { ISuman } from "../dts/suman";
import { IPseudoError } from "../dts/global";
export declare const makeGracefulExit: (suman: ISuman) => (errs: any[] | Error | IPseudoError, cb: Function) => any;
