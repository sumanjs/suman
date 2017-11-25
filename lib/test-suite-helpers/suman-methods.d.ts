import { Suman } from "../suman";
import { ItHook } from "suman-types/dts/it";
import { TDescribeHook } from "suman-types/dts/describe";
import { TBeforeEachHook } from "suman-types/dts/before-each";
import { TAfterEachHook } from "suman-types/dts/after-each";
import { TBeforeHook } from "suman-types/dts/before";
import { TAfterHook } from "suman-types/dts/after";
export declare class DefineObject {
    protected exec: any;
    protected opts: any;
    constructor(desc: string, exec: any);
    inject(): DefineObject;
    plan(v: number): DefineObject;
    desc(v: string): DefineObject;
    title(v: string): DefineObject;
    name(v: string): DefineObject;
    description(v: string): DefineObject;
    skip(v: boolean): DefineObject;
    only(v: boolean): DefineObject;
    parallel(v: boolean): DefineObject;
    series(v: boolean): DefineObject;
    mode(v: string): DefineObject;
    timeout(v: number): DefineObject;
}
export declare class DefineObjectTestOrHook extends DefineObject {
    throws(v: string | RegExp): DefineObject;
    cb(v: boolean): DefineObject;
    events(): DefineObject;
    successEvents(...args: (string | Array<string>)[]): DefineObject;
    successEvent(...args: string[]): DefineObject;
    errorEvents(...args: (Array<string> | string)[]): DefineObject;
    errorEvent(...args: string[]): DefineObject;
}
export declare class DefineObjectAllHook extends DefineObjectTestOrHook {
    fatal(v: boolean): DefineObject;
    first(v: boolean): DefineObject;
    last(v: boolean): DefineObject;
    always(v: boolean): DefineObject;
    run(fn: TBeforeHook | TAfterHook): DefineObject;
}
export declare class DefineObjectEachHook extends DefineObjectTestOrHook {
    fatal(v: boolean): DefineObjectTestOrHook;
    run(fn: TBeforeEachHook | TAfterEachHook): DefineObjectTestOrHook;
}
export declare class DefineObjectTestCase extends DefineObjectTestOrHook {
    run(fn: ItHook): DefineObjectTestCase;
}
export declare class DefineObjectContext extends DefineObject {
    source(...args: string[]): DefineObjectContext;
    names(...args: string[]): DefineObjectContext;
    run(fn: TDescribeHook): DefineObjectContext;
}
export declare const makeSumanMethods: (suman: Suman, TestBlock: any, gracefulExit: Function, notifyParent: Function) => any;
