

import {Subscription} from "rxjs";
import {IAllOpts} from "./test-suite";

export interface IInjectFn {
    (desc?:string, opts?: IInjectOpts, fn?: Function): void,
    cb?: IInjectFn,
    skip?: IInjectFn
}

export interface IInjectOpts extends IAllOpts {
    cb: boolean;
}



export interface IInjectHook {


}


export type IInjectHookCallbackMode = (h: IInjectHook) => void;
export type IInjectHookRegularMode = (h?: IInjectHook) => Promise<any> | Subscription | undefined;
