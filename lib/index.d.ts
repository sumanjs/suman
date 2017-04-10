/// <reference types="node" />
declare namespace suman {
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
declare const suman: suman.IInitExport;
export = suman;
