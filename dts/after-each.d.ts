

export interface IAfterEachFn {
    (desc:string, opts: IAfterEachOpts, fn: Function): void,
    cb?: IAfterEachFn,
    skip?: IAfterEachFn
}

export interface IAfterEachOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


export interface IAfterEachHook {


}


export type TAfterEachHook = (h: any) => any;
export type TAfterEachHookCallbackMode = (h: IAfterEachHook) => void;
export type TAfterEachHookRegularMode = (h?: IAfterEachHook | undefined) => Promise<any>;
