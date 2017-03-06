

// before

interface IBeforeFn {
    (desc:string, opts: IBeforeOpts, fn: Function): void,
    cb?: IBeforeFn,
    skip?: IBeforeFn
}

interface IBeforeOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


interface IBeforeHook {


}



type BeforeHookCallbackMode = (h: IBeforeHook) => void;
type BeforeHookRegularMode = (h?: IBeforeHook | undefined) => Promise<any>;
