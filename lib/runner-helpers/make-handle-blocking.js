/**
 * Created by denman on 3/18/2016.
 */

//#core
const path = require('path');

//#npm
const _ = require('lodash');
const Immutable = require('immutable');

//#project
const sumanUtils = require('../utils');

////////////////////////////////////////////////

const started = [];
const ended = [];
const arrayofVals = [];

module.exports = order => {

    function findCPsToStart(obstructed, forkedCPs) {

        const obstructedKeysOfStartedButNotEnded = _.flattenDeep(started.filter(function ($item) {
            return ended.every(function (item) {
                return item.value.testPath !== $item.value.testPath;
            });
        }).map(function (item) {
            return item.value.obstructs;
        }));

        const obstructedTestPathsOfCurrentlyRunningProcesses = arrayofVals.filter(function (item) {
            return _.includes(obstructedKeysOfStartedButNotEnded, item.key);
        }).map(function (item) {
            return item.value.testPath;
        });

        const haveNotStarted = arrayofVals.filter(function ($item) {
            return started.every(function (item) {
                return item.value.testPath !== $item.value.testPath;
            });
        }).map(function (item) {
            return item.value.testPath;
        });


        const obstructedTestPaths = arrayofVals.filter(function (item) {
            return _.includes(obstructed, item.key);
        }).map(function (item) {
            return item.value.testPath;
        });


        const cpsToStartNext = [];


        forkedCPs.forEach(function (cp) {

            const testPath = cp.testPath;

            /*

            we need to check 3 things:

            (1) that this testPath of this cp has not already been started
            (2) that the testPath of this cp is actually included in the list of obstructed (TODO: do we need this?)
            (3) that the testPath of this cp is not obstructed by any currently running process

            */

            if (_.includes(haveNotStarted, testPath) && _.includes(obstructedTestPaths, testPath)
                && !_.includes(obstructedTestPathsOfCurrentlyRunningProcesses, testPath)) {

                cpsToStartNext.push(cp);
            }

        });


        return cpsToStartNext;

    }

    return {

        getStartedAndEnded: function () {
            return {
                started: started,
                ended: ended
            }
        },

        determineInitialStarters: function (files) {

            Object.keys(order).forEach(function (key) {
                const value = order[key];
                const testPath = value.testPath;
                arrayofVals.push({
                    key: key,
                    value: {
                        obstructs: value.obstructs,
                        testPath: path.resolve(sumanUtils.findProjectRoot() + '/' + testPath)
                    }
                });
            });

            files.forEach(function (file) {

                const length = arrayofVals.filter(function (item) {
                    return String(item.value.testPath) === String(file);
                });

                if (length < 1) {
                    arrayofVals.push({
                        key: 'SUMAN_RESERVED_KEY',
                        value: {
                            testPath: file,
                            obstructs: []
                        }
                    });
                }
            });

            const vals = _.sortBy(arrayofVals, function (item) {
                return -1 * item.value.obstructs.length;
            });

            vals.forEach(function (val) {
                const notObstructed = started.every(function (item) {   //http://stackoverflow.com/questions/6260756/how-to-stop-javascript-foreach
                    return !(_.includes(item.value.obstructs, val.key));
                });

                if (notObstructed) {
                    started.push(val);  //add val to started list only if the key is not already in any already added obstructed list
                }
            });

            console.log('\n', 'Tests included in run at start:');
            started.forEach(function (item) {
                console.log(JSON.stringify(item));
            });

            console.log('\n', 'Tests blocked in run at start:'); //TODO: need to add "empty" if the list is empty
            arrayofVals.filter(function (val) {
                return started.every(function (item) {
                    return item.key !== val.key;
                });
            }).forEach(function (item) {
                console.log(JSON.stringify(item));
            });


            return this;
        },

        shouldFileBeBlockedAtStart: function shouldFileBeBlockedAtStart(file) {
            for (var i = 0; i < started.length; i++) {
                var s = started[i];
                if (String(s.value.testPath) === String(file)) {
                    return false;
                }
            }
            return true;
        },

        releaseNextTests: function releaseNextTests(n, forkedCPs) {

            const testPath = n.testPath;

            const val = started.filter(function (item) {
                return String(item.value.testPath) === String(testPath);
            })[0];

            ended.push(val);

            const obstructed = val.value.obstructs;

            if (obstructed.length > 0) {
                const cps = findCPsToStart(obstructed, forkedCPs);
                cps.forEach(function (cp) {
                    started.push(arrayofVals.filter(function (item) {
                        return String(item.value.testPath) === (cp.testPath);
                    })[0]);
                    cp.send({
                        unblocked: true
                    })
                });
            }

        }
    }


};