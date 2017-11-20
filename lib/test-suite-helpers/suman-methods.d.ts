import { Suman } from "../suman";
export declare class DefineObject {
    private exec;
    private opts;
    constructor(desc: string, exec: any);
    inject(): DefineObject;
    plan(v: number): DefineObject;
    desc(v: string): DefineObject;
    title(v: string): DefineObject;
    name(v: string): DefineObject;
    description(v: string): DefineObject;
    throws(v: string | RegExp): DefineObject;
    cb(v: boolean): DefineObject;
    fatal(v: boolean): DefineObject;
    skip(v: boolean): DefineObject;
    only(v: boolean): DefineObject;
    parallel(v: boolean): DefineObject;
    series(v: boolean): DefineObject;
    mode(v: string): DefineObject;
    first(v: boolean): DefineObject;
    last(v: boolean): DefineObject;
    always(v: boolean): DefineObject;
    timeout(v: number): DefineObject;
    source(...args: string[]): DefineObject;
    names(...args: string[]): DefineObject;
    run(fn: Function): DefineObject;
}
export declare const makeSumanMethods: (suman: Suman, TestBlock: any, gracefulExit: Function, notifyParent: Function) => any;
