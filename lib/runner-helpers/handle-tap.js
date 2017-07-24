'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var su = require("suman-utils");
var chalk = require("chalk");
var parser = require('tap-parser');
var suman_events_1 = require("suman-events");
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var first = true;
exports.getTapParser = function () {
    if (first) {
        _suman.log('we are handling TAP.');
    }
    var p = parser();
    p.on('complete', function (data) {
        resultBroadcaster.emit(String(suman_events_1.events.TAP_COMPLETE), data);
    });
    p.on('assert', function (testpoint) {
        debugger;
        if (first) {
            first = false;
            console.log('\n');
            _suman.log(chalk.yellow.bold('suman we have received at least one test result via TAP.'));
            console.log('\n');
        }
        su.isSumanDebug(function () {
            console.log('testpoint:', testpoint);
        });
        resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), testpoint);
        if (testpoint.skip) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), testpoint);
        }
        else if (testpoint.todo) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED), testpoint);
        }
        else if (testpoint.ok) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_PASS), testpoint);
        }
        else {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_FAIL), testpoint);
        }
    });
    return p;
};
