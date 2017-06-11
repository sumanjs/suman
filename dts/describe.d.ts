

// DESCRIBE

export interface IDescribeFn {
    (desc:string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook): void,
    delay?: IDescribeFn,
    skip?: IDescribeFn,
    only?: IDescribeFn
}

export interface IDescribeOpts {
    __preParsed:boolean

}


export type TDescribeHook = (...args: any[]) => void;
