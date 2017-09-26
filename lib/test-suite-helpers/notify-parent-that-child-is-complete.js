'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
exports.areAllChildBlocksCompleted = function (block) {
    if (block.allChildBlocksCompleted) {
        return true;
    }
    var children = block.getChildren();
    for (var i = 0; i < children.length; i++) {
        if (!children[i].allChildBlocksCompleted) {
            return false;
        }
    }
    return block.allChildBlocksCompleted = true;
};
exports.makeNotifyParent = function (suman, gracefulExit, handleBeforesAndAfters) {
    return function notifyParentThatChildIsComplete(parent, child, cb) {
        if (!parent.allChildBlocksCompleted) {
            return process.nextTick(cb);
        }
        async.eachSeries(parent.getAfters(), function (aBeforeOrAfter, cb) {
            handleBeforesAndAfters(child, aBeforeOrAfter, cb);
        }, function complete(err, results) {
            implementationError(err);
            gracefulExit(results, function () {
                if (parent.parent) {
                    notifyParentThatChildIsComplete(parent.parent, parent, cb);
                }
                else {
                    process.nextTick(cb);
                }
            });
        });
    };
};
