'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.makeTranspileQueue = function (failedTransformObjects, outer, queuedTestFns) {
    var sumanOpts = _suman.sumanOpts, sumanConfig = _suman.sumanConfig, projectRoot = _suman.projectRoot;
    var waitForAllTranformsToFinish = sumanOpts.wait_for_all_transforms;
    return async.queue(function (task, cb) {
        task(function (err, file, shortFile, stdout, stderr, gd) {
            if (err) {
                _suman.logError('tranpile error => ', err.stack || err);
                failedTransformObjects.push({ err: err, file: file, shortFile: shortFile, stdout: stdout, stderr: stderr });
                return;
            }
            setImmediate(function () {
                console.log(chalk.red('pushing file '), file);
                if (waitForAllTranformsToFinish) {
                    queuedTestFns.push(function () {
                        outer(file, shortFile, stdout, gd);
                    });
                }
                else {
                    outer(file, shortFile, stdout, gd);
                }
                cb(null);
            });
        });
    }, 3);
};
