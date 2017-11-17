'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var flattenDeep = require('lodash.flattendeep');
var _suman = global.__suman = (global.__suman || {});
var oncePost = require("../once-post");
var oncePostInvoked = false;
exports.oncePostFn = function (cb) {
    if (!oncePostInvoked) {
        oncePostInvoked = true;
        oncePost.run(function (err, results) {
            err && _suman.log.error(err.stack || err);
            if (Array.isArray(results)) {
                results.filter(function (r) { return r; }).forEach(function (r) {
                    _suman.log.error(r.stack || r);
                });
            }
            else if (results) {
                _suman.log.error('Suman implemenation warning: results is not an array:');
                _suman.log.error(util.inspect(results));
            }
            process.nextTick(cb);
        });
    }
    else {
        _suman.log.error(new Error("Suman implementation warning => \"" + exports.oncePostFn.name + "\" was called more than once.").stack);
        process.nextTick(cb);
    }
};
