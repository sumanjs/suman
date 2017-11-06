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
        oncePost.run(_suman.oncePostKeys, _suman.userData, function (err, results) {
            if (err) {
                _suman.log.error(err.stack || err);
            }
            if (Array.isArray(results)) {
                results.filter(function (r) { return r; }).forEach(function (r) {
                    _suman.log.error(r.stack || r);
                });
            }
            else if (results) {
                _suman.log.error('Suman implemenation warning: results is not an array...', util.inspect(results));
            }
            process.nextTick(cb);
        });
    }
    else {
        process.nextTick(cb, new Error('Suman warning => oncePostFn was called more than once =>'));
    }
};
