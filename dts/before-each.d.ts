

// before

interface IBeforeEachFn {
    (desc:string, opts: IBeforeEachOpts, fn: Function): void,
    cb?: IBeforeEachFn,
    skip?: IBeforeEachFn
}

interface IBeforeEachOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


interface IBeforeEachHook {


}



type BeforeEachHookCallbackMode = (h: IBeforeEachHook) => void;
type BeforeEachHookRegularMode = (h?: IBeforeEachHook | undefined) => Promise<any>;
