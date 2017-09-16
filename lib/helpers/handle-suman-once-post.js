'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var flattenDeep = require('lodash.flattendeep');
var _suman = global.__suman = (global.__suman || {});
var once_post_1 = require("../once-post");
var oncePostInvoked = false;
exports.oncePostFn = function (cb) {
    if (!oncePostInvoked) {
        oncePostInvoked = true;
        once_post_1.default.run(_suman.oncePostKeys, _suman.userData, function (err, results) {
            if (err) {
                console.error(err.stack || err);
            }
            if (Array.isArray(results)) {
                results.filter(function (r) { return r; }).forEach(function (r) {
                    console.error(r.stack || r);
                });
            }
            else if (results) {
                console.log('Results is not an array... =>', results);
            }
            process.nextTick(cb);
        });
    }
    else {
        process.nextTick(cb, new Error(' => Suman warning => oncePostFn was called more than once =>'));
    }
};
