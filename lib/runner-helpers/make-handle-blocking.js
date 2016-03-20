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


        const obstructedKeysOfStartedButNotEnded = function () {

            const testPathsofCurrentRunningProcesses = [];  //TODO: the below function has side effects that populate this array, need to fix

            const $obstructedKeysOfStartedButNotEnded = _.flattenDeep(started.filter(function ($item) {
                const isEvery = ended.every(function (item) {
                    return (String(item.value.testPath) !== String($item.value.testPath));
                });
                if (isEvery) {
                    testPathsofCurrentRunningProcesses.push($item.value.testPath);
                }
                return isEvery;
            }).map(function (item) {
                return item.value.obstructs;
            }));

            return {
                $obstructedKeysOfStartedButNotEnded: $obstructedKeysOfStartedButNotEnded,
                testPathsofCurrentRunningProcesses: testPathsofCurrentRunningProcesses
            }
        };

        const obstructedTestPathsOfCurrentlyRunningProcesses = function () {

            const $obstructedKeysOfStartedButNotEnded = obstructedKeysOfStartedButNotEnded().$obstructedKeysOfStartedButNotEnded;
            return arrayofVals.filter(function (item) {
                return _.includes($obstructedKeysOfStartedButNotEnded, item.key);
            }).map(function (item) {
                return item.value.testPath;
            });
        };

        const haveNotStarted = function () {
            return arrayofVals.filter(function ($item) {
                return started.every(function (item) {
                    return item.value.testPath !== $item.value.testPath;
                });
            }).map(function (item) {
                return item.value.testPath;
            });
        };

        const obstructedTestPaths = function (testPath) {

            const obstructList = _.flattenDeep(arrayofVals.filter(function (item) {
                return String(item.value.testPath) === String(testPath);
            }).map(function (item) {
                return item.value.obstructs;
            }));

            return arrayofVals.filter(function (item) {
                return _.includes(obstructList, item.key);
            }).map(function (item) {
                return item.value.testPath;
            });

        };

        const cpsToStartNext = [];


        forkedCPs.forEach(function (cp) {

            const testPath = cp.testPath;

            /*

             note: we need to check 3 things:

             (1) that the testPath of this cp has not already been started
             (2) that the testPath of this cp is actually included in the list of obstructed (TODO: do we need this?)
             (3) that the testPath of this cp is not obstructed by any currently running process
             (4) that a testPath of any currently running process is not obstructed by the testPath of this cp

             */

            /* const testPathIsInListOfObstructedItems =  _.includes(obstructedTestPaths, testPath); */

            const $obstructedTestPaths = obstructedTestPaths(testPath);
            const $testPathsofCurrentRunningProcesses = obstructedKeysOfStartedButNotEnded().testPathsofCurrentRunningProcesses;
            const $obstructedTestPathsOfCurrentlyRunningProcesses = obstructedTestPathsOfCurrentlyRunningProcesses();

            const thisTestPathHasNotBeenRunYet = _.includes(haveNotStarted(), testPath);
            const testPathIsNotObstructed = !_.includes($obstructedTestPathsOfCurrentlyRunningProcesses, testPath);
            const testPathsOwnObstructsListDoesntExcludeCurrentlyRunningProcesses =
                _.intersection($obstructedTestPaths, $testPathsofCurrentRunningProcesses).length < 1;

            if (thisTestPathHasNotBeenRunYet
                && testPathIsNotObstructed
                && testPathsOwnObstructsListDoesntExcludeCurrentlyRunningProcesses) {

                started.push(arrayofVals.filter(function (item) {
                    return String(item.value.testPath) === (cp.testPath);
                })[0]);

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
                if (_.includes(files, testPath)) {
                    arrayofVals.push({
                        key: key,
                        value: {
                            obstructs: value.obstructs,
                            testPath: testPath
                        }
                    });
                }
            });

            files.forEach(function (file) {

                const length = arrayofVals.filter(function (item) {
                    return String(item.value.testPath) === String(file);
                }).length;


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

                // for every item that has already made the started list, make sure none of those obstruction lists include our new val.key
                const notObstructedFirstCheck = started.every(function (item) {   //http://stackoverflow.com/questions/6260756/how-to-stop-javascript-foreach
                    return !(_.includes(item.value.obstructs, val.key));
                });

                // for every item in our new attempted value, make sure it does not obstruct an item that has already made the list
                const notObstructedSecondCheck = val.value.obstructs.every(function (key) {
                    return started.every(function ($item) {
                        return String($item.key) !== String(key);
                    });
                });

                if (notObstructedFirstCheck && notObstructedSecondCheck) {
                    started.push(val);  //add val to started list only if the key is not already in any already added obstructed list
                }
            });

            if(process.env.NODE_ENV === 'dev_local'){
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

                console.log('\n');
            }


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

        releaseNextTests: function releaseNextTests(testPath, forkedCPs) {

            const val = started.filter(function (item) {
                return String(item.value.testPath) === String(testPath);
            })[0];

            ended.push(val);

            if (process.env.NODE_ENV === 'dev_local') {
                console.log('Test ended:', JSON.stringify(val));
            }

            const obstructed = _.flattenDeep(val.value.obstructs, arrayofVals.filter(function (item) {
                return _.includes(item.value.obstructs, val.key);
            }).map(function (item) {
                return item.value.obstructs;
            }));

            //if (obstructed.length > 0) {
            const cps = findCPsToStart(obstructed, forkedCPs);
            cps.forEach(function (cp) {
                if (process.env.NODE_ENV === 'dev_local') {
                    console.log('Test path started and is now running => ', cp.testPath);
                }
                cp.send({
                    unblocked: true
                })
            });
            //}

        }
    }
};