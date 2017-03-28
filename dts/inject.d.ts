



import {Subscription} from "rxjs";

interface IInjectFn {
    (desc?:string, opts?: IInjectOpts, fn?: Function): void,
    cb?: IInjectFn,
    skip?: IInjectFn
}

interface IInjectOpts {
    cb: boolean,
    __preParsed: boolean
}



interface IInjectHook {


}


type IInjectHookCallbackMode = (h: IInjectHook) => void;
type IInjectHookRegularMode = (h?: IInjectHook) => Promise<any> | Subscription | undefined;
