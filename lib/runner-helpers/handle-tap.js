'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var chalk = require("chalk");
var parser = require('tap-parser');
var tap_json_parser_1 = require("tap-json-parser");
var suman_events_1 = require("suman-events");
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var firstTAPOccurrence = true;
var firstTAPCall = true;
exports.getTapParser = function () {
    if (firstTAPCall) {
        firstTAPCall = false;
        _suman.log.info(chalk.black.bold('we are handling TAP.'));
    }
    var p = parser();
    p.on('complete', function (data) {
        rb.emit(String(suman_events_1.events.TAP_COMPLETE), data);
    });
    p.on('assert', function (testpoint) {
        if (firstTAPOccurrence) {
            firstTAPOccurrence = false;
            console.log('\n');
            _suman.log.info(chalk.yellow.bold('suman we have received at least one test result via TAP.'));
            console.log('\n');
        }
        rb.emit(String(suman_events_1.events.TEST_CASE_END), testpoint);
        if (testpoint.skip) {
            rb.emit(String(suman_events_1.events.TEST_CASE_SKIPPED), testpoint);
        }
        else if (testpoint.todo) {
            rb.emit(String(suman_events_1.events.TEST_CASE_STUBBED), testpoint);
        }
        else if (testpoint.ok) {
            rb.emit(String(suman_events_1.events.TEST_CASE_PASS), testpoint);
        }
        else {
            rb.emit(String(suman_events_1.events.TEST_CASE_FAIL), testpoint);
        }
    });
    return p;
};
var firstTAPJSONOccurrence = true;
var firstTAPJSONCall = true;
exports.getTapJSONParser = function () {
    if (firstTAPJSONCall) {
        firstTAPJSONCall = false;
        _suman.log.info(chalk.black.bold('we are handling TAP-JSON.'));
    }
    var p = tap_json_parser_1.default();
    p.on('testpoint', function (d) {
        if (firstTAPJSONOccurrence) {
            firstTAPJSONOccurrence = false;
            console.log('\n');
            _suman.log.info(chalk.yellow.bold('suman runner has received first test result via TAP.'));
            console.log('\n');
        }
        var testpoint = d.testCase;
        if (!testpoint) {
            _suman.log.error('implementation error: testpoint data does not exist for tap-json object => ', util.inspect(d));
            return;
        }
        rb.emit(String(suman_events_1.events.TEST_CASE_END_TAP_JSON), d);
        if (testpoint.skip) {
            rb.emit(String(suman_events_1.events.TEST_CASE_SKIPPED_TAP_JSON), d);
        }
        else if (testpoint.todo) {
            rb.emit(String(suman_events_1.events.TEST_CASE_STUBBED_TAP_JSON), d);
        }
        else if (testpoint.ok) {
            rb.emit(String(suman_events_1.events.TEST_CASE_PASS_TAP_JSON), d);
        }
        else {
            rb.emit(String(suman_events_1.events.TEST_CASE_FAIL_TAP_JSON), d);
        }
    });
    return p;
};
