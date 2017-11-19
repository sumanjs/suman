import { Suman } from "../suman";
export declare class DefineObject {
    private exec;
    private opts;
    constructor(exec: any);
    inject(): DefineObject;
    name(v: string): DefineObject;
    timeout(v: number): DefineObject;
    names(...args: any[]): DefineObject;
    run(fn: Function): DefineObject;
}
export declare const makeSumanMethods: (suman: Suman, TestBlock: any, gracefulExit: Function, notifyParent: Function) => any;
