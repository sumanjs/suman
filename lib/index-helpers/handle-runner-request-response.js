'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var socketio_child_client_1 = require("./socketio-child-client");
exports.handleRequestResponseWithRunner = function (data) {
    var accumulatedData = {
        ROOT_SUITE_NAME: '',
        SUITE_COUNT: 0,
        SUITE_SKIPPED_COUNT: 0,
        TEST_CASES_TOTAL: 0,
        TEST_CASES_FAILED: 0,
        TEST_CASES_PASSED: 0,
        TEST_CASES_SKIPPED: 0,
        TEST_CASES_STUBBED: 0,
        TEST_FILE_MILLIS: Date.now() - _suman.sumanInitStartDate
    };
    data.forEach(function (d) {
        accumulatedData.SUITE_COUNT += d.SUITE_COUNT;
        accumulatedData.SUITE_SKIPPED_COUNT += d.SUITE_SKIPPED_COUNT;
        accumulatedData.TEST_CASES_TOTAL += d.TEST_CASES_TOTAL;
        accumulatedData.TEST_CASES_FAILED += d.TEST_CASES_FAILED;
        accumulatedData.TEST_CASES_PASSED += d.TEST_CASES_PASSED;
        accumulatedData.TEST_CASES_SKIPPED += d.TEST_CASES_SKIPPED;
        accumulatedData.TEST_CASES_STUBBED += d.TEST_CASES_STUBBED;
    });
    return function (cb) {
        try {
            if (window.__karma__) {
                return process.nextTick(cb);
            }
        }
        catch (err) { }
        var client = socketio_child_client_1.getClient();
        var TABLE_DATA = constants.runner_message_type.TABLE_DATA;
        var timedout = false;
        var to = setTimeout(function () {
            timedout = true;
            _suman.log.error('Action to receive table data response from runner timed out.');
            cb(null);
        }, 1000);
        client.on(TABLE_DATA, function onTableDataReceived(data) {
            if (data.info = 'table-data-received' && timedout === false) {
                clearTimeout(to);
                process.nextTick(cb);
            }
        });
        var childId;
        try {
            if (window) {
                childId = window.__suman.SUMAN_CHILD_ID;
            }
        }
        catch (err) { }
        client.emit(TABLE_DATA, {
            type: constants.runner_message_type.TABLE_DATA,
            data: accumulatedData,
            childId: childId || process.env.SUMAN_CHILD_ID
        });
    };
};
