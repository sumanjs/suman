/**
 * Created by denman on 1/5/2016.
 */


var _ = require('underscore');


function makeGetAllEaches(suman, allTests) {

    function getAllBeforesEaches(test) {

        var beforeEaches = [];
        beforeEaches.unshift(test.beforeEaches);

        function getParentBefores(testId) {

            var parent = null;

            for (var i = 0; i < allTests.length; i++) {
                var temp = allTests[i];
                if (temp.testId === testId) {
                    parent = temp;
                    break;
                }
            }

            if (parent) {
                beforeEaches.unshift(parent.beforeEaches);
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

        var afterEaches = [];
        afterEaches.push(test.afterEaches);

        function getParentAfters(testId) {

            var parent = null;

            for (var i = 0; i < allTests.length; i++) {
                var temp = allTests[i];
                if (temp.testId === testId) {
                    parent = temp;
                    break;
                }
            }

            if (parent) {
                afterEaches.push(parent.afterEaches);
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
