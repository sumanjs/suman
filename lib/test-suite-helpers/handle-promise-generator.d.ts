import { ISumanDomain } from "suman-types/dts/global";
export declare const handlePotentialPromise: (done: Function, str: string) => (val: any, warn: boolean, d: ISumanDomain) => void;
export declare const makeHandleGenerator: (done: Function) => (fn: Function, args: any[], ctx: Object) => void;
declare let $exports: any;
export default $exports;
