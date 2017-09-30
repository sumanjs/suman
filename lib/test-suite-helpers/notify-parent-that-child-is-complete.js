'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
exports.makeNotifyParent = function (suman, gracefulExit, handleBeforesAndAfters) {
    return function notifyParentThatChildIsComplete(child, cb) {
        var parent = child.parent;
        if (!parent) {
            return process.nextTick(cb);
        }
        if (child.desc === 'rudolph' || parent.desc === 'rudolph') {
            debugger;
        }
        var parentProto = Object.getPrototypeOf(parent);
        if (!child.allChildBlocksCompleted && child.getChildren().length > 0) {
            debugger;
            return process.nextTick(cb);
        }
        if (!parent.completedChildrenMap.get(child)) {
            parent.completedChildrenMap.set(child, true);
            parent.childCompletionCount++;
        }
        if (parent.childCompletionCount === parent.getChildren().length) {
            parent.allChildBlocksCompleted = true;
        }
        if (parent.childCompletionCount > parent.getChildren().length) {
            parent.allChildBlocksCompleted = true;
            _suman.logWarning('Suman implementation warning => parent.childCompletionCount should never be greater than ' +
                'parent.getChildren().length');
        }
        if (!parent.allChildBlocksCompleted) {
            debugger;
            return process.nextTick(cb);
        }
        if (parent.alreadyStartedAfterHooks) {
            debugger;
            return process.nextTick(cb);
        }
        parentProto.afterHooksCallback = function (cb) {
            parent.alreadyStartedAfterHooks = true;
            async.mapSeries(parent.getAfters(), function (aBeforeOrAfter, cb) {
                handleBeforesAndAfters(child, aBeforeOrAfter, cb);
            }, function complete(err, results) {
                debugger;
                implementationError(err);
                gracefulExit(results, function () {
                    notifyParentThatChildIsComplete(parent, cb);
                });
            });
        };
        if (parent.couldNotRunAfterHooksFirstPass) {
            debugger;
            parent.afterHooksCallback(cb);
        }
        else {
            process.nextTick(cb);
        }
    };
};
