import { IDescribeOpts, TDescribeHook } from "../../dts/describe";
declare const container: {
    before: () => any;
    after: () => any;
    beforeEach: () => any;
    afterEach: () => any;
    describe: (desc: string, opts: IDescribeOpts, arr?: (string | TDescribeHook)[], fn?: TDescribeHook) => any;
    it: () => any;
    inject: () => any;
};
export default container;
