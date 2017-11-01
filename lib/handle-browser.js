'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var EE = require("events");
var _suman = global.__suman = (global.__suman || {});
var suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
var constants = require('../config/suman-constants').constants;
var handle_suman_shutdown_1 = require("./helpers/handle-suman-shutdown");
exports.run = function (testRegistrationQueue, testQueue) {
    testQueue.drain = function () {
        if (testRegistrationQueue.idle()) {
            _suman.log.verygood('we are done with all tests in the browser.');
            handle_suman_shutdown_1.shutdownProcess();
        }
    };
    _suman.log.good('resuming test registration in the browser.');
    testRegistrationQueue.resume();
};
