import async = require('async');
export declare const makeTranspileQueue: (failedTransformObjects: any, runFile: any, queuedTestFns: any) => async.AsyncQueue<Function>;
