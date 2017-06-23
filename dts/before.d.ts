import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import EventEmitter = NodeJS.EventEmitter;
import {IHookParam, IOnceHookObj} from "./test-suite";

export interface IBeforeObj extends IOnceHookObj {
  // currently has no extra properties beyond IOnceHookObj
}

type SubsetOfBeforeOpts = Partial<IBeforeOpts>;
type IBeforeFnArgTypes = SubsetOfBeforeOpts | TBeforeHook | Array<string | SubsetOfBeforeOpts | TBeforeHook>;

export interface IBeforeFn {
  // (desc?: string, opts?: IBeforeOpts, fn?: TBeforeHook): void,
  (name: string, ...args: IBeforeFnArgTypes[]): void;
  cb?: IBeforeFn;
  skip?: IBeforeFn;
}

export interface IBeforeOpts {
  __preParsed?: boolean;
  skip: boolean;
  timeout: number;
  fatal: boolean;
  cb: boolean;
  throws: RegExp;
  plan: number;
}

export type BeforeHookCallbackMode = (h: IHookParam) => void;
export type BeforeHookRegularMode = (h?: IHookParam) => Promise<any>;
export type BeforeHookObservableMode = (h?: IHookParam) => Observable<any>;
export type BeforeHookSubscriberMode = (h?: IHookParam) => Subscriber<any>;
export type BeforeHookEEMode = (h?: IHookParam) => EventEmitter;


export type TBeforeHook =
  BeforeHookCallbackMode |
  BeforeHookRegularMode |
  BeforeHookObservableMode |
  BeforeHookSubscriberMode |
  BeforeHookEEMode



