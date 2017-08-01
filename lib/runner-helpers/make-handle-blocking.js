'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var util = require('util');
var colors = require('colors/safe');
var sortBy = require('lodash.sortby');
var includes = require('lodash.includes');
var flattenDeep = require('lodash.flattendeep');
var intersection = require('lodash.intersection');
var _suman = global.__suman = (global.__suman || {});
var weAreDebugging = require('../helpers/we-are-debugging');
var su = require('suman-utils');
var started = [];
var ended = [];
function default_1(order) {
    var config = _suman.sumanConfig;
    var maxProcs = _suman.maxProcs;
    var interval = 10000;
    var timeout = 1000;
    if (true || _suman.sumanOpts && _suman.sumanOpts.verbosity > 2) {
        setInterval(function () {
            setTimeout(function () {
                console.log('started.length => ', started.length);
                console.log('ended.length => ', ended.length);
                var startedButNotEnded = started.filter(function ($item) {
                    return ended.every(function (item) {
                        return (String(item.testPath) !== String($item.testPath));
                    });
                }).map(function (item) {
                    return '\n  ' + item.testPath;
                });
                if (startedButNotEnded.length > 0) {
                    console.log('\n\n', colors.bgCyan.black.bold(' => Suman message => The following test ' +
                        'processes have started but not ended yet:'), colors.cyan(startedButNotEnded));
                    console.log('\n\n');
                }
            }, timeout += 8000);
        }, interval);
    }
    function findQueuedCPsToStart(queuedCPsObj) {
        if (started.length - ended.length < maxProcs) {
            return queuedCPsObj.queuedCPs.pop();
        }
    }
    return {
        runNext: function (fn) {
            if (started.length - ended.length < maxProcs) {
                started.push(fn);
                fn.call(null);
                return true;
            }
        },
        getStartedAndEnded: function () {
            return {
                started: started,
                ended: ended
            };
        },
        determineInitialStarters: function (files) {
            throw new Error('no longer used.');
        },
        shouldFileBeBlockedAtStart: function (file) {
            throw new Error('no longer used.');
        },
        releaseNextTests: function releaseNextTests(testPath, queuedCPsObj) {
            var val = started.filter(function (item) {
                return String(item.testPath) === String(testPath);
            })[0];
            ended.push(val);
            var cpFn = findQueuedCPsToStart(queuedCPsObj);
            if (cpFn) {
                started.push(cpFn);
                _suman.log('Test path started and is now running => ', cpFn.testPath);
                cpFn.call(null);
            }
        }
    };
}
exports.default = default_1;
;
