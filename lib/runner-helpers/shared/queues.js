'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var runQueue = null;
exports.getRunQueue = function () {
    return runQueue;
};
exports.makeRunQueue = function () {
    var maxProcs = _suman.maxProcs;
    return runQueue = async.queue(function (task, cb) { return task(cb); }, maxProcs);
};
var transpileQueue = null;
exports.getTranspileQueue = function () {
    return transpileQueue;
};
exports.makeTranspileQueue = function (failedTransformObjects, runFile, queuedTestFns) {
    var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, projectRoot = _suman.projectRoot;
    var waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
    return transpileQueue = async.queue(function (task, cb) {
        task(function (err, file, shortFile, stdout, stderr, gd) {
            if (err) {
                _suman.log.error('tranpile error => ', err.stack || err);
                failedTransformObjects.push({ err: err, file: file, shortFile: shortFile, stdout: stdout, stderr: stderr });
                return;
            }
            setImmediate(cb);
            if (waitForAllTranformsToFinish) {
                queuedTestFns.push(function () {
                    runFile(file, shortFile, stdout, gd);
                });
            }
            else {
                runFile(file, shortFile, stdout, gd);
            }
        });
    }, 3);
};
