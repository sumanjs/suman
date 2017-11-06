'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var tap_json_parser_1 = require("tap-json-parser");
var suman_events_1 = require("suman-events");
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var first = true;
exports.getTapJSONParser = function () {
    var p = tap_json_parser_1.default();
    p.on('testpoint', function (testpoint) {
        if (first) {
            first = false;
            console.log('\n');
            _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP.'));
            console.log('\n');
        }
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
