

// before

export interface IBeforeEachFn {
    (desc:string, opts: IBeforeEachOpts, fn: Function): void,
    cb?: IBeforeEachFn,
    skip?: IBeforeEachFn
}

export interface IBeforeEachOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


export interface IBeforeEachHook {


}

export type BeforeEachHookCallbackMode = (h: IBeforeEachHook) => void;
export type BeforeEachHookRegularMode = (h?: IBeforeEachHook | undefined) => Promise<any>;
