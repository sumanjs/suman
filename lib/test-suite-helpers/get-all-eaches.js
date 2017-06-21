'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _ = require('underscore');
var _suman = global.__suman = (global.__suman || {});
exports.getAllBeforesEaches = function (zuite) {
    var beforeEaches = [];
    beforeEaches.unshift(zuite.getBeforeEaches());
    function getParentBefores(parent) {
        if (parent) {
            beforeEaches.unshift(parent.getBeforeEaches());
            if (parent.parent) {
                getParentBefores(parent.parent);
            }
        }
        else {
            throw new Error(' => Suman implementation error => this should not happen...please report.');
        }
    }
    if (zuite.parent) {
        getParentBefores(zuite.parent);
    }
    return _.flatten(beforeEaches, true);
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
            throw new Error(' => Suman implementation error => this should not happen...please report.');
        }
    }
    if (zuite.parent) {
        getParentAfters(zuite.parent);
    }
    return _.flatten(afterEaches, true);
};
var $exports = module.exports;
exports.default = $exports;
