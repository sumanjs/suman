'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var chalk = require("chalk");
var suman_watch_1 = require("suman-watch");
var _suman = global.__suman = (global.__suman || {});
exports.run = function (projectRoot, paths, sumanOpts, sumanConfig) {
    _suman.log.info('"--watch" option selected => Suman will watch files in your project, and run your tests on changes.');
    if (sumanOpts.verbosity > 2) {
        _suman.log.info('"--watch" option selected => Using the "watch" property object in your suman.conf.js file,' +
            'you can also configure Suman to do whatever you want based off a file change.');
    }
    suman_watch_1.runWatch(projectRoot, paths, sumanConfig, sumanOpts, function (err) {
        if (err) {
            console.log('\n');
            console.error(err.stack || err);
            console.log('\n');
            process.exit(1);
        }
        else {
            console.log('\n');
            _suman.logInfo(chalk.underline('Suman watch successfully initialized.'));
        }
    });
};
