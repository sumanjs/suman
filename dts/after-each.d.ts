

// before

interface IAfterEachFn {
    (desc:string, opts: IAfterEachOpts, fn: Function): void,
    cb?: IAfterEachFn,
    skip?: IAfterEachFn
}

interface IAfterEachOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


interface IAfterEachHook {


}


type AfterEachHook = (h: any) => any;
type AfterEachHookCallbackMode = (h: IAfterEachHook) => void;
type AfterEachHookRegularMode = (h?: IAfterEachHook | undefined) => Promise<any>;
