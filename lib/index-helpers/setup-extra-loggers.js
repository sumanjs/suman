"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var util = require("util");
var fs = require("fs");
var inBrowser = false;
var _suman = global.__suman = (global.__suman || {});
var IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
var SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
var callable = true;
function default_1(usingRunner, testDebugLogPath, testLogPath, $module) {
    if (usingRunner && callable) {
        callable = false;
        _suman.writeTestError = function (data, options) {
            if (!data) {
                data = new Error('falsy data passed to writeTestError').stack;
            }
            if (typeof data !== 'string') {
                data = util.inspect(data);
            }
            options = options || {};
            assert(typeof options === 'object', ' => Options should be an object.');
            if (true || IS_SUMAN_DEBUG) {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
        _suman._writeLog = function (data) {
            if (IS_SUMAN_DEBUG) {
                fs.appendFileSync(testDebugLogPath, data);
            }
        };
    }
    else {
        if (SUMAN_SINGLE_PROCESS) {
            fs.writeFileSync(testLogPath, '\n => [SUMAN_SINGLE_PROCESS mode] Next Suman run @' + new Date() +
                '\n Test file => "' + $module.filename + '"', { flag: 'a' });
        }
        else {
            fs.writeFileSync(testLogPath, '\n\n => Test file => "' + $module.filename + '"\n\n', { flag: 'a' });
        }
        _suman._writeLog = function (data) {
            fs.appendFileSync(testLogPath, data);
        };
        _suman.writeTestError = function (data, ignore) {
            if (!ignore) {
                _suman.checkTestErrorLog = true;
            }
            if (data) {
                if (typeof data !== 'string') {
                    data = util.inspect(data);
                }
                fs.appendFileSync(testDebugLogPath, '\n' + data + '\n');
            }
            else {
                _suman.logError('Suman implementation error => no data passed to writeTestError. Please report.');
            }
        };
        fs.writeFileSync(testDebugLogPath, '\n\n', { flag: 'a', encoding: 'utf8' });
        _suman.writeTestError('\n\n', true);
        _suman.writeTestError(' ### Suman start run @' + new Date(), true);
        _suman.writeTestError(' ### Filename => ' + $module.filename, true);
        _suman.writeTestError(' ### Command => ' + JSON.stringify(process.argv), true);
    }
}
exports.default = default_1;
