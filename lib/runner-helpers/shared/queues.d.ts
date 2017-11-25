export declare const getRunQueue: () => any;
export declare const makeRunQueue: () => AsyncQueue<{}>;
export declare const getTranspileQueue: () => any;
export declare const makeTranspileQueue: (failedTransformObjects: any, runFile: Function, queuedTestFns: any) => AsyncQueue<Function>;
