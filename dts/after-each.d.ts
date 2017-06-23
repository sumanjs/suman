import {IEachHookObj, IHookParam} from "./test-suite";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import EventEmitter = NodeJS.EventEmitter;


type SubsetOfAfterEachOpts = Partial<IAfterEachOpts>;
type IAfterEachFnArgTypes = SubsetOfAfterEachOpts | TAfterEachHook | Array<string | SubsetOfAfterEachOpts | TAfterEachHook>;

export interface IAfterEachFn {
  // (desc?: string; opts?: IAfterOpts; fn?: TAfterEachHook): void;
  (name: string, ...args: IAfterEachFnArgTypes[]): void;
  cb?: IAfterEachFn;
  skip?: IAfterEachFn
}

export interface IAfterEachOpts {
  __preParsed?: boolean,
  skip: boolean,
  timeout: number,
  fatal: boolean,
  cb: boolean,
  throws: RegExp,
  plan: number
}

export interface IAFterEachObj extends IEachHookObj {
  desc: string,
  throws: RegExp,
  type: string,
  warningErr: Error
}

type AfterEachHookCallbackMode = (h: IHookParam) => void;
type AfterEachHookRegularMode = (h?: IHookParam) => Promise<any>;
type AfterEachHookObservableMode = (h?: IHookParam) => Observable<any>;
type AfterEachHookSubscriberMode = (h?: IHookParam) => Subscriber<any>;
type AfterEachHookEEMode = (h?: IHookParam) => EventEmitter;

export type TAfterEachHook =
  AfterEachHookCallbackMode |
  AfterEachHookRegularMode |
  AfterEachHookObservableMode |
  AfterEachHookSubscriberMode |
  AfterEachHookEEMode

