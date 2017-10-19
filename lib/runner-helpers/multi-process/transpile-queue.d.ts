import async = require('async');
export declare const makeTranspileQueue: (failedTransformObjects: any, outer: any, queuedTestFns: any) => async.AsyncQueue<Function>;
