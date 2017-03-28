/// <reference types="node" />
export interface Ioc {
    a: string;
    b: string;
}
export interface IInitOpts {
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
export interface ICreate {
    create: Function;
}
export interface IInit {
    (module: NodeModule, opts: IInitOpts): ICreate;
    $ingletonian?: any;
    tooLate?: boolean;
}
export interface IInitExport {
    load: Function;
    autoPass: Function;
    autoFail: Function;
    init: IInit;
    constants: Object;
    Writable: Function;
    Transform: Function;
    once: Function;
}
declare const indexExports: IInitExport;
export = indexExports;
