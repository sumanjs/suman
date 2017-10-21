import { AsyncQueue } from 'async';
export declare const getTranspileQueue: () => AsyncQueue<Function>;
export declare const makeTranspileQueue: (failedTransformObjects: any, runFile: Function, queuedTestFns: any) => AsyncQueue<Function>;
