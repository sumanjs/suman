'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
var makeGen = require('../helpers/async-gen');
exports.handlePotentialPromise = function (done, str) {
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
            var _next_1 = val._next;
            var _error_1 = val._error;
            var _complete_1 = val._complete;
            val._next = function () {
                _next_1.apply(val, arguments);
            };
            val._error = function (e) {
                _error_1.apply(val, arguments);
                done(e || new Error('Suman dummy error.'));
            };
            val._complete = function () {
                _complete_1.apply(val, arguments);
                done();
            };
        }
        else if (su.isStream(val)) {
            var success = function () {
                process.nextTick(done);
            };
            val.once('end', success);
            val.once('close', success);
            val.once('done', success);
            val.once('finish', success);
            val.once('error', function (e) {
                done(e || new Error('Suman dummy error.'));
            });
        }
        else {
            Promise.resolve(val).then(function () {
                done(null);
            }, done);
        }
    };
};
exports.makeHandleGenerator = function (done) {
    return function (fn, args, ctx) {
        var gen = makeGen(fn, ctx);
        gen.apply(ctx, args).then(function (val) {
            done(null, val);
        }, done);
    };
};
var $exports = module.exports;
exports.default = $exports;
