'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _ = require("lodash");
var _suman = global.__suman = (global.__suman || {});
exports.getAllBeforesEaches = function (zuite) {
    var beforeEaches = [];
    beforeEaches.unshift(zuite.getBeforeEaches());
    if (!zuite.alreadyHandledAfterAllParentHooks) {
        zuite.alreadyHandledAfterAllParentHooks = true;
        beforeEaches.unshift(zuite.getAfterAllParentHooks());
    }
    var getParentBefores = function (parent) {
        beforeEaches.unshift(parent.getBeforeEaches());
        if (parent.parent) {
            getParentBefores(parent.parent);
        }
    };
    if (zuite.parent) {
        getParentBefores(zuite.parent);
    }
    return _.flatten(beforeEaches);
};
exports.getAllAfterEaches = function (zuite) {
    var afterEaches = [];
    afterEaches.push(zuite.getAfterEaches());
    var getParentAfters = function (parent) {
        afterEaches.push(parent.getAfterEaches());
        if (parent.parent) {
            getParentAfters(parent.parent);
        }
    };
    if (zuite.parent) {
        getParentAfters(zuite.parent);
    }
    return _.flatten(afterEaches);
};
