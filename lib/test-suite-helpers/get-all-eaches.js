'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//npm
const _ = require('underscore');

//project
const _suman = global.__suman = (global.__suman || {});

////////////////////////////////////////////////////////////////////

function makeGetAllEaches(suman, allDescribeBlocks) {

    function getAllBeforesEaches(test) {

        const beforeEaches = [];
        beforeEaches.unshift(test.getBeforeEaches());

        function getParentBefores(testId) {

            let parent = null;

            for (let i = 0; i < allDescribeBlocks.length; i++) {
                let temp = allDescribeBlocks[i];
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
                throw new Error('this should not happen...');
            }

        }

        if (test.parent) {
            getParentBefores(test.parent.testId);
        }

        return _.flatten(beforeEaches, true);
    }

    function getAllAfterEaches(test) {

        const afterEaches = [];
        afterEaches.push(test.getAfterEaches());

        function getParentAfters(testId) {

            let parent = null;

            for (let i = 0; i < allDescribeBlocks.length; i++) {
                let temp = allDescribeBlocks[i];
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
                throw new Error('this should not happen...');
            }

        }

        if (test.parent) {
            getParentAfters(test.parent.testId);
        }

        return _.flatten(afterEaches, true);
    }

    return {
        getAllAfterEaches: getAllAfterEaches,
        getAllBeforesEaches: getAllBeforesEaches
    }
}


module.exports = makeGetAllEaches;
