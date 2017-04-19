

// before

import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

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
type BeforeHookRegularMode = (h?: IBeforeHook) => Promise<any>;
type BeforeHookObservableMode = (h?: IBeforeHook) => Observable<any>;
type BeforeHookSubscriberMode = (h?: IBeforeHook) => Subscriber<any>;
type BeforeHookEEMode = (h?: IBeforeHook) => EventEmitter;

type TBeforeHook = BeforeHookCallbackMode |
  BeforeHookRegularMode | BeforeHookObservableMode
  | BeforeHookSubscriberMode | BeforeHookEEMode
