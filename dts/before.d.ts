

// before
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import EventEmitter = NodeJS.EventEmitter;

export interface IBeforeFn {
    (desc:string, opts: IBeforeOpts, fn: Function): void,
    cb?: IBeforeFn,
    skip?: IBeforeFn
}

export interface IBeforeOpts {
    __preParsed?: boolean,
    skip: boolean,
    timeout: number,
    fatal: boolean,
    cb: boolean,
    throws: RegExp,
    plan: number
}


export interface IBeforeHook {


}


export type BeforeHookCallbackMode = (h: IBeforeHook) => void;
export type BeforeHookRegularMode = (h?: IBeforeHook) => Promise<any>;
export type BeforeHookObservableMode = (h?: IBeforeHook) => Observable<any>;
export type BeforeHookSubscriberMode = (h?: IBeforeHook) => Subscriber<any>;
export type BeforeHookEEMode = (h?: IBeforeHook) => EventEmitter;

export type TBeforeHook = BeforeHookCallbackMode |
  BeforeHookRegularMode | BeforeHookObservableMode
  | BeforeHookSubscriberMode | BeforeHookEEMode
