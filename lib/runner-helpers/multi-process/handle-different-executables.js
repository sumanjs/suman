'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var fs = require("fs");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.makeHandleDifferentExecutables = function (projectRoot, sumanOpts) {
    return {
        handleRunDotShFile: function (sh, argz, cpOptions, cb) {
            _suman.log.info(chalk.bgWhite.underline('Suman has found a @run.sh file => '), chalk.bold(sh));
            cpOptions.cwd = projectRoot;
            fs.chmod(sh, 511, function (err) {
                if (err) {
                    return cb(err);
                }
                if (sumanOpts.coverage) {
                    _suman.log.warning(chalk.yellow('coverage option was set to true, but we are running your tests via @run.sh.'));
                    _suman.log.warning(chalk.yellow('so in this case, you will need to run your coverage call via @run.sh.'));
                }
                var n = cp.spawn(sh, argz, cpOptions);
                cb(null, n);
            });
        }
    };
};
