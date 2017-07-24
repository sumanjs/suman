'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require('async');
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
exports.makeNotifyParent = function (suman, gracefulExit, handleBeforesAndAfters) {
    return function notifyParentThatChildIsComplete(parentTestId, childTestId, cb) {
        var parent = null;
        var allDescribeBlocks = suman.allDescribeBlocks;
        for (var i = 0; i < allDescribeBlocks.length; i++) {
            var temp = allDescribeBlocks[i];
            if (temp.testId === parentTestId) {
                parent = temp;
                break;
            }
        }
        if (!parent) {
            throw new Error(' => Suman implementation error => No parent defined for child, this should not happen.');
        }
        else {
            var lastChild = parent.getChildren()[parent.getChildren().length - 1];
            if (lastChild.testId === childTestId) {
                async.mapSeries(parent.getAfters(), handleBeforesAndAfters, function complete(err, results) {
                    implementationError(err);
                    gracefulExit(results, null, function () {
                        if (parent.parent) {
                            notifyParentThatChildIsComplete(parent.parent.testId, parent.testId, cb);
                        }
                        else {
                            process.nextTick(cb);
                        }
                    });
                });
            }
            else {
                process.nextTick(cb);
            }
        }
    };
};
var $exports = module.exports;
exports.default = $exports;
