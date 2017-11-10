'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var chalk = require("chalk");
var tap_json_parser_1 = require("tap-json-parser");
var suman_events_1 = require("suman-events");
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var first = true;
exports.getTapJSONParser = function () {
    var p = tap_json_parser_1.default();
    p.on('testpoint', function (d) {
        if (first) {
            first = false;
            console.log('\n');
            _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP.'));
            console.log('\n');
        }
        var testpoint = d.testCase;
        if (!testpoint) {
            _suman.log.error('implementation warning: testpoint data does not exist for tap-json object => ', util.inspect(d));
            return;
        }
        resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_END_TAP_JSON), d);
        if (testpoint.skip) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_SKIPPED_TAP_JSON), d);
        }
        else if (testpoint.todo) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_STUBBED_TAP_JSON), d);
        }
        else if (testpoint.ok) {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_PASS_TAP_JSON), d);
        }
        else {
            resultBroadcaster.emit(String(suman_events_1.events.TEST_CASE_FAIL_TAP_JSON), d);
        }
    });
    return p;
};
