

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


type TAfterEachHook = (h: any) => any;
type TAfterEachHookCallbackMode = (h: IAfterEachHook) => void;
type TAfterEachHookRegularMode = (h?: IAfterEachHook | undefined) => Promise<any>;
