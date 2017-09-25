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
    function getParentBefores(parent) {
        if (parent) {
            beforeEaches.unshift(parent.getBeforeEaches());
            if (parent.parent) {
                getParentBefores(parent.parent);
            }
        }
        else {
            throw new Error(' => Suman implementation error => please report on Github.');
        }
    }
    if (zuite.parent) {
        getParentBefores(zuite.parent);
    }
    return _.flatten(beforeEaches);
};
exports.getAllAfterEaches = function (zuite) {
    var afterEaches = [];
    afterEaches.push(zuite.getAfterEaches());
    function getParentAfters(parent) {
        if (parent) {
            afterEaches.push(parent.getAfterEaches());
            if (parent.parent) {
                getParentAfters(parent.parent);
            }
        }
        else {
            throw new Error(' => Suman implementation error => please report on Github.');
        }
    }
    if (zuite.parent) {
        getParentAfters(zuite.parent);
    }
    return _.flatten(afterEaches);
};
