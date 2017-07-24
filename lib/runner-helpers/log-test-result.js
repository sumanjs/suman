'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var suman_events_1 = require("suman-events");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
exports.logTestResult = function (data, n) {
    var test = data.test;
    resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END), test);
    if (test.errorDisplay) {
        resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_FAIL), test);
    }
    else {
        if (test.skipped) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), test);
        }
        else if (test.stubbed) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED), test);
        }
        else {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_PASS), test);
        }
    }
};
