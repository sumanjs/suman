'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var util = require("util");
var chalk = require("chalk");
var sortBy = require('lodash.sortby');
var includes = require('lodash.includes');
var flattenDeep = require('lodash.flattendeep');
var intersection = require('lodash.intersection');
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var weAreDebugging = su.weAreDebugging;
var started = [];
var ended = [];
var arrayOfVals = [];
function default_1(order) {
    var config = _suman.sumanConfig;
    var maxProcs = _suman.maxProcs;
    var interval = 10000;
    var timeout = 1000;
    if (_suman.sumanOpts && _suman.sumanOpts.verbosity > 2) {
        setInterval(function () {
            setTimeout(function () {
                var startedButNotEnded = started.filter(function ($item) {
                    return ended.every(function (item) {
                        return (String(item.value.testPath) !== String($item.value.testPath));
                    });
                }).map(function (item) {
                    return '\n  ' + item.value.testPath;
                });
                if (startedButNotEnded.length > 1) {
                    console.log('\n\n', chalk.bgCyan.black.bold(' => Suman message => The following test ' +
                        'processes have started but not ended yet:'), chalk.cyan(startedButNotEnded));
                    console.log('\n\n');
                }
            }, timeout += 8000);
        }, interval);
    }
    function findQueuedCPsToStart(obstructed, queuedCPsObj) {
        var queuedCPs = queuedCPsObj.queuedCPs;
        var obstructedKeysOfStartedButNotEnded = function () {
            var testPathsofCurrentRunningProcesses = [];
            var $obstructedKeysOfStartedButNotEnded = flattenDeep(started.filter(function ($item) {
                var isEvery = ended.every(function (item) {
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
            };
        };
        var obstructedTestPathsOfCurrentlyRunningProcesses = function () {
            var $obstructedKeysOfStartedButNotEnded = obstructedKeysOfStartedButNotEnded().$obstructedKeysOfStartedButNotEnded;
            return arrayOfVals.filter(function (item) {
                return includes($obstructedKeysOfStartedButNotEnded, item.key);
            }).map(function (item) {
                return item.value.testPath;
            });
        };
        var haveNotStarted = function () {
            return arrayOfVals.filter(function ($item) {
                return started.every(function (item) {
                    return item.value.testPath !== $item.value.testPath;
                });
            }).map(function (item) {
                return item.value.testPath;
            });
        };
        var obstructedTestPaths = function (testPath) {
            var obstructList = flattenDeep(arrayOfVals.filter(function (item) {
                return String(item.value.testPath) === String(testPath);
            }).map(function (item) {
                return item.value.obstructs;
            }));
            return arrayOfVals.filter(function (item) {
                return includes(obstructList, item.key);
            }).map(function (item) {
                return item.value.testPath;
            });
        };
        var queuedCPsToStartNext = [];
        var indexesToRemove = [];
        queuedCPs.forEach(function (fn, index) {
            var testPath = fn.testPath;
            var $obstructedTestPaths = obstructedTestPaths(testPath);
            var $testPathsofCurrentRunningProcesses = obstructedKeysOfStartedButNotEnded().testPathsofCurrentRunningProcesses;
            var $obstructedTestPathsOfCurrentlyRunningProcesses = obstructedTestPathsOfCurrentlyRunningProcesses();
            var thisTestPathHasNotBeenRunYet = includes(haveNotStarted(), testPath);
            var testPathIsNotObstructed = !includes($obstructedTestPathsOfCurrentlyRunningProcesses, testPath);
            var testPathsOwnObstructsListDoesntExcludeCurrentlyRunningProcesses = intersection($obstructedTestPaths, $testPathsofCurrentRunningProcesses).length < 1;
            var isNotMaxedOut = $testPathsofCurrentRunningProcesses.length < maxProcs;
            if (isNotMaxedOut
                && thisTestPathHasNotBeenRunYet
                && testPathIsNotObstructed
                && testPathsOwnObstructsListDoesntExcludeCurrentlyRunningProcesses) {
                started.push(arrayOfVals.filter(function (item) {
                    return String(item.value.testPath) === String(fn.testPath);
                })[0]);
                indexesToRemove.push(index);
                queuedCPsToStartNext.push(fn);
            }
        });
        queuedCPsObj.queuedCPs = queuedCPs.filter(function (item, index) {
            return !includes(indexesToRemove, index);
        });
        return queuedCPsToStartNext;
    }
    return {
        canRunNext: function () {
            return started.length - ended.length < maxProcs;
        },
        getStartedAndEnded: function () {
            return {
                started: started,
                ended: ended
            };
        },
        determineInitialStarters: function (files) {
            Object.keys(order).forEach(function (key) {
                var value = order[key];
                var testPath = value.testPath;
                if (includes(files, testPath)) {
                    arrayOfVals.push({
                        key: key,
                        value: {
                            testPath: testPath,
                            obstructs: value.obstructs
                        }
                    });
                }
            });
            files.forEach(function (file) {
                var length = arrayOfVals.filter(function (item) {
                    return String(item.value.testPath) === String(file);
                }).length;
                if (length < 1) {
                    arrayOfVals.push({
                        key: 'SUMAN_RESERVED_KEY',
                        value: {
                            testPath: file,
                            obstructs: []
                        }
                    });
                }
            });
            var vals = sortBy(arrayOfVals, function (item) {
                return -1 * item.value.obstructs.length;
            });
            vals.forEach(function (val) {
                var notObstructedFirstCheck = started.every(function (item) {
                    return !(includes(item.value.obstructs, val.key));
                });
                var notObstructedSecondCheck = val.value.obstructs.every(function (key) {
                    return started.every(function ($item) {
                        return String($item.key) !== String(key);
                    });
                });
                if (notObstructedFirstCheck && notObstructedSecondCheck && started.length < maxProcs) {
                    started.push(val);
                }
            });
        },
        shouldFileBeBlockedAtStart: function (file) {
            for (var i = 0; i < started.length; i++) {
                var s = started[i];
                if (String(s.value.testPath) === String(file)) {
                    return false;
                }
            }
            return true;
        },
        releaseNextTests: function releaseNextTests(testPath, queuedCPsObj) {
            var val = started.filter(function (item) {
                return String(item.value.testPath) === String(testPath);
            })[0];
            ended.push(val);
            if (su.isSumanDebug()) {
                console.log(' => SUMAN_DEBUG => Test ended:', util.inspect(val));
            }
            var obstructed = flattenDeep(val.value.obstructs, arrayOfVals.filter(function (item) {
                return includes(item.value.obstructs, val.key);
            }).map(function (item) {
                return item.value.obstructs;
            }));
            var cpFns = findQueuedCPsToStart(obstructed, queuedCPsObj);
            cpFns.forEach(function (fn) {
                _suman.log.info('Test path started and is now running => ', fn.testPath);
                fn.call(null);
            });
        }
    };
}
exports.default = default_1;
;
