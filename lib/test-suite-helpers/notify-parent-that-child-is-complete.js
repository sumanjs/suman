'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var async = require("async");
var _suman = global.__suman = (global.__suman || {});
var implementationError = require('../helpers/implementation-error');
exports.makeNotifyParent = function (suman, gracefulExit, handleBeforesAndAfters) {
    return function notifyParentThatChildIsComplete(parent, child, cb) {
        var lastChild = parent.getChildren()[parent.getChildren().length - 1];
        if (lastChild === child) {
            async.mapSeries(parent.getAfters(), function (aBeforeOrAfter, cb) {
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
        }
        else {
            process.nextTick(cb);
        }
    };
};
