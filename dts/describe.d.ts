

// DESCRIBE

interface IDescribeFn {
    (desc:string, opts: IDescribeOpts, arr?: Array<string | TDescribeHook>, fn?: TDescribeHook): void,
    delay?: IDescribeFn,
    skip?: IDescribeFn,
    only?: IDescribeFn
}

interface IDescribeOpts {
    __preParsed:boolean

}


type TDescribeHook = (...args: any[]) => void;
