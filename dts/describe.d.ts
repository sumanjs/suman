
type IDescribeFnArgTypes = IDescribeOpts | TDescribeHook | Array<string | TDescribeHook>;

export interface IDescribeFn {
    (s: string, ...args: IDescribeFnArgTypes[]): void,
    delay?: IDescribeFn,
    skip?: IDescribeFn,
    only?: IDescribeFn
}

export interface IDescribeOpts {
    __preParsed:boolean

}

export type TDescribeHook = (...args: any[]) => void;
