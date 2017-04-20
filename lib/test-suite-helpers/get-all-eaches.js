'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _ = require('underscore');
var _suman = global.__suman = (global.__suman || {});
module.exports = function (suman, allDescribeBlocks) {
    function getAllBeforesEaches(zuite) {
        var beforeEaches = [];
        beforeEaches.unshift(zuite.getBeforeEaches());
        function getParentBefores(testId) {
            var parent = null;
            for (var i = 0; i < allDescribeBlocks.length; i++) {
                var temp = allDescribeBlocks[i];
                if (temp.testId === testId) {
                    parent = temp;
                    break;
                }
            }
            if (parent) {
                beforeEaches.unshift(parent.getBeforeEaches());
                if (parent.parent) {
                    getParentBefores(parent.parent.testId);
                }
            }
            else {
                throw new Error(' => Suman implementation error => this should not happen...please report.');
            }
        }
        if (zuite.parent) {
            getParentBefores(zuite.parent.testId);
        }
        return _.flatten(beforeEaches, true);
    }
    function getAllAfterEaches(zuite) {
        var afterEaches = [];
        afterEaches.push(zuite.getAfterEaches());
        function getParentAfters(testId) {
            var parent = null;
            for (var i = 0; i < allDescribeBlocks.length; i++) {
                var temp = allDescribeBlocks[i];
                if (temp.testId === testId) {
                    parent = temp;
                    break;
                }
            }
            if (parent) {
                afterEaches.push(parent.getAfterEaches());
                if (parent.parent) {
                    getParentAfters(parent.parent.testId);
                }
            }
            else {
                throw new Error(' => Suman implementation error => this should not happen...please report.');
            }
        }
        if (zuite.parent) {
            getParentAfters(zuite.parent.testId);
        }
        return _.flatten(afterEaches, true);
    }
    return {
        getAllAfterEaches: getAllAfterEaches,
        getAllBeforesEaches: getAllBeforesEaches
    };
};
