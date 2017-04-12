/// <reference types="node" />
declare module "freeze-existing" {
    var _default: (obj: any) => any;
    export = _default;
}
declare module "index" {
    namespace suman {
        interface ILoadOpts {
            path: string;
            indirect: boolean;
        }
        interface Ioc {
            a: string;
            b: string;
        }
        interface IInitOpts {
            export?: boolean;
            __expectedExitCode?: number;
            pre?: Array<string>;
            integrants?: Array<string>;
            series?: boolean;
            writable?: boolean;
            timeout?: number;
            post?: Array<any>;
            interface?: string;
            iocData?: Object;
            ioc?: Object;
        }
        interface ICreate {
            create: Function;
        }
        interface IInit {
            (module: NodeModule, opts: IInitOpts): ICreate;
            $ingletonian?: any;
            tooLate?: boolean;
        }
        interface IInitExport {
            load: Function;
            autoPass: Function;
            autoFail: Function;
            init: IInit;
            constants: Object;
            Writable: Function;
            Transform: Function;
            once: Function;
        }
    }
    const suman: suman.IInitExport;
    export = suman;
}
declare module "make-test-suite" {
}
declare module "cli-commands/install-global-deps" {
    var _default: (deps: string[]) => void;
    export = _default;
}
declare const cp: any;
declare const path: any;
declare const fs: any;
declare const colors: any;
declare const _suman: any;
declare const script: any;
declare const k: any;
declare module "cli-commands/run-diagnostics" {
    var _default: (cb?: Function) => void;
    export = _default;
}
declare module "test-suite-methods/make-after-each" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
declare module "test-suite-methods/make-after" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
declare module "test-suite-methods/make-before-each" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
declare module "test-suite-methods/make-before" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
declare module "test-suite-methods/make-describe" {
    var _default: (suman: ISuman, gracefulExit: Function, TestSuiteMaker: TTestSuiteMaker, zuite: ITestSuite, notifyParentThatChildIsComplete: Function) => Function;
    export = _default;
}
declare module "test-suite-methods/make-inject" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
declare module "test-suite-methods/make-it" {
    var _default: (suman: ISuman, zuite: ITestSuite) => Function;
    export = _default;
}
