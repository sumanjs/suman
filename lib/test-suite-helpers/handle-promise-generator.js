'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var _ = require("lodash");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var general_1 = require("../helpers/general");
var defaultSuccessEvents = ['success', 'finish', 'close', 'end', 'done'];
var defaultErrorEvents = ['error'];
exports.handleReturnVal = function (done, str, testOrHook) {
    return function handle(val, warn, d) {
        if ((!val || (typeof val.then !== 'function')) && warn) {
            _suman.writeTestError('\n Suman warning: you may have forgotten to return a Promise => \n' + str + '\n');
        }
        if (su.isObservable(val)) {
            val.subscribe(function onNext(val) {
                console.log(' => Suman Observable subscription onNext => ', util.inspect(val));
            }, function onError(e) {
                done(e || new Error('Suman dummy error.'));
            }, function onCompleted() {
                done();
            });
        }
        else if (su.isSubscriber(val)) {
            var next_1 = val._next;
            var _error_1 = val._error;
            var complete_1 = val._complete;
            val._next = function () {
                next_1.apply(val, arguments);
            };
            val._error = function (e) {
                _error_1.apply(val, arguments);
                done(e || new Error('Suman dummy error.'));
            };
            val._complete = function () {
                complete_1.apply(val, arguments);
                done();
            };
        }
        else if (su.isStream(val) || su.isEventEmitter(val)) {
            var first_1 = true;
            var onSuccess_1 = function () {
                if (first_1) {
                    first_1 = false;
                    process.nextTick(done);
                }
            };
            var onError_1 = function (e) {
                if (first_1) {
                    first_1 = false;
                    process.nextTick(done, e || new Error('Suman dummy error.'));
                }
            };
            var eventsSuccess = testOrHook.events && testOrHook.events.success;
            var eventsError = testOrHook.events && testOrHook.events.error;
            var successEvents = (testOrHook.successEvents || eventsSuccess) ?
                _.flattenDeep([testOrHook.successEvents, eventsSuccess]) : defaultSuccessEvents;
            successEvents.forEach(function (name) {
                val.once(name, onSuccess_1);
            });
            var errorEvents = (testOrHook.errorEvents || eventsError) ?
                _.flattenDeep([testOrHook.errorEvents, eventsError]) : defaultErrorEvents;
            errorEvents.forEach(function (name) {
                val.once(name, onError_1);
            });
        }
        else {
            Promise.resolve(val).then(function () {
                done(null);
            }, function (err) {
                done(err || new Error('Suman unkwnown error'));
            });
        }
    };
};
exports.handleGenerator = function (fn, args) {
    var gen = general_1.makeRunGenerator(fn, null);
    return gen.apply(null, args);
};
