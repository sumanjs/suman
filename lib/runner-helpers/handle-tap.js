'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var parser = require('tap-parser');
var suman_events_1 = require("suman-events");
var EE = require('events');
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
module.exports = function getParser() {
    var p = parser();
    p.on('complete', function (data) {
        resultBroadcaster.emit(String(suman_events_1.events.TAP_COMPLETE), data);
    });
    p.on('assert', function (testpoint) {
        debugger;
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
