'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require('util');
var flattenDeep = require('lodash.flattendeep');
var _suman = global.__suman = (global.__suman || {});
var oncePost = require('../once-post');
var oncePostInvoked = false;
function oncePostFn(cb) {
    if (!oncePostInvoked) {
        oncePostInvoked = true;
        oncePost(flattenDeep(_suman.oncePostKeys), _suman.userData, function (err, results) {
            if (err) {
                console.error(err.stack || err);
            }
            if (Array.isArray(results)) {
                results.filter(function (r) { return r; }).forEach(function (r) {
                    console.error(r.stack || r);
                });
            }
            else {
                console.log('Results is not an array... =>', results);
            }
            process.nextTick(cb);
        });
    }
    else {
        process.nextTick(cb, new Error(' => Suman warning => oncePostFn was called more than once =>'));
    }
}
exports.default = oncePostFn;
;
