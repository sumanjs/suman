
import {IHookParam, IOnceHookObj} from "./test-suite";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import EventEmitter = NodeJS.EventEmitter;


type SubsetOfAfterOpts = Partial<IAfterOpts>;
type IAfterFnArgTypes = SubsetOfAfterOpts | TAfterHook | Array<string | SubsetOfAfterOpts | TAfterHook>;


export interface IAfterFn {
  // (desc?: string; opts?: IAfterOpts; fn?: TAfterHook): void;
  (name: string, ...args: IAfterFnArgTypes[]): void;
  cb?: IAfterFn,
  skip?: IAfterFn,
  always?: IAfterFn,
  last?: IAfterFn
}


export interface IAfterObj extends IOnceHookObj {
  last: boolean;
  always: boolean;
}


export interface IAfterOpts {
  __preParsed?: boolean;
  skip: boolean;
  timeout: number;
  fatal: boolean;
  cb: boolean;
  throws: RegExp;
  plan: number;
  last: boolean;
  always: boolean;
}

export type AfterHookCallbackMode = (h: IHookParam) => void;
export type AfterHookRegularMode = (h?: IHookParam) => Promise<any>;
export type AfterHookObservableMode = (h?: IHookParam) => Observable<any>;
export type AfterHookSubscriberMode = (h?: IHookParam) => Subscriber<any>;
export type AfterHookEEMode = (h?: IHookParam) => EventEmitter;


export type TAfterHook =
  AfterHookCallbackMode |
  AfterHookRegularMode |
  AfterHookObservableMode |
  AfterHookSubscriberMode |
  AfterHookEEMode
