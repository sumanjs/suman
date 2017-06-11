

import {Subscription} from "rxjs";

export interface IInjectFn {
    (desc?:string, opts?: IInjectOpts, fn?: Function): void,
    cb?: IInjectFn,
    skip?: IInjectFn
}

export interface IInjectOpts {
    cb: boolean,
    __preParsed: boolean
}



export interface IInjectHook {


}


export type IInjectHookCallbackMode = (h: IInjectHook) => void;
export type IInjectHookRegularMode = (h?: IInjectHook) => Promise<any> | Subscription | undefined;
