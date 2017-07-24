'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require("assert");
var suman_utils_1 = require("suman-utils");
var colors = require('colors/safe');
var suman_watch_1 = require("suman-watch");
var _suman = global.__suman = (global.__suman || {});
exports.run = function (paths, sumanOpts, sumanConfig) {
    console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and run your tests on changes.');
    if (_suman.sumanOpts.verbosity > 2) {
        console.log(' => Suman message => --watch option selected => Using the "watch" property object in your suman.conf.js file,' +
            'you can also configure Suman to do whatever you want based off a file change.');
    }
    var watchPer = null;
    if (sumanOpts.watch_per) {
        assert(suman_utils_1.default.isObject(sumanConfig.watch), colors.red(' => Suman usage error => suman.conf.js needs a "watch" property that is an object.'));
        assert(suman_utils_1.default.isObject(sumanConfig.watch.per), colors.red(' => Suman usage error => suman.conf.js "watch" object, needs property called "per" that is an object.'));
        watchPer = sumanConfig.watch.per[sumanOpts.watch_per];
        assert(suman_utils_1.default.isObject(watchPer), colors.red(" => Suman usage error => key \"" + sumanOpts.watch_per + "\", \n      does not exist on the {suman.conf.js}.watch.per object."));
    }
    suman_watch_1.default.run(Object.freeze({
        paths: paths,
        watchPer: watchPer,
        noTranspile: sumanOpts.no_transpile,
        noRun: sumanOpts.no_run
    }), function (err) {
        if (err) {
            console.log('\n');
            console.error(err.stack || err);
            process.exit(1);
        }
        else {
            console.log('\n');
            _suman.logInfo(colors.underline('Suman watch successfully initialized.'));
        }
    });
};
