
import {IAllOpts} from "./test-suite";
type IDescribeFnArgTypes = IDescribeOpts | TDescribeHook | Array<string | TDescribeHook>;

export interface IDescribeFn {
    (s: string, ...args: IDescribeFnArgTypes[]): void,
    delay?: IDescribeFn,
    skip?: IDescribeFn,
    only?: IDescribeFn
}

export interface IDescribeOpts extends IAllOpts {

}

export type TDescribeHook = (...args: any[]) => void;
