import { Suman } from "../suman";
export declare class DefineObject {
    private exec;
    private opts;
    constructor(exec: any);
    inject(): DefineObject;
    plan(v: number): DefineObject;
    name(v: string): DefineObject;
    throws(v: string | RegExp): DefineObject;
    cb(v: boolean): DefineObject;
    fatal(v: boolean): DefineObject;
    first(v: boolean): DefineObject;
    last(v: boolean): DefineObject;
    always(v: boolean): DefineObject;
    timeout(v: number): DefineObject;
    source(...args: string[]): DefineObject;
    names(...args: string[]): DefineObject;
    run(fn: Function): DefineObject;
}
export declare const makeSumanMethods: (suman: Suman, TestBlock: any, gracefulExit: Function, notifyParent: Function) => any;
