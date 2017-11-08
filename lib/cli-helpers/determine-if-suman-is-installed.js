'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var fs = require('fs');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
exports.vetLocalInstallations = function (sumanConfig, opts, projectRoot) {
    var sumanInstalledLocally = false, sumanInstalledAtAll = false, sumanServerInstalled = false, sumanIsSymlinkedLocally = false;
    var sumanNodeModulesPath = path.resolve(projectRoot + '/node_modules/suman');
    try {
        if (fs.lstatSync(sumanNodeModulesPath).isSymbolicLink()) {
            sumanIsSymlinkedLocally = true;
        }
    }
    catch (err) {
    }
    try {
        require.resolve(sumanNodeModulesPath);
        sumanInstalledLocally = true;
    }
    catch (e) {
        sumanInstalledLocally = false;
    }
    if (sumanInstalledLocally) {
        if (opts.verbosity > 7) {
            _suman.log.info(chalk.blue('Suman appears to be installed locally.'));
        }
    }
    else {
        if (opts.verbosity > 2) {
            _suman.log.info(chalk.yellow('note that Suman is not installed locally, you may wish to run "$ suman --init"'));
        }
    }
    try {
        require.resolve('suman');
        sumanInstalledAtAll = true;
    }
    catch (e) {
        sumanInstalledAtAll = false;
    }
    if (sumanInstalledAtAll) {
        if (opts.verbosity > 7) {
            _suman.log.info(chalk.blue(' Suman appears to be installed locally.'));
        }
    }
    else {
        if (!sumanIsSymlinkedLocally && opts.verbosity > 2) {
            _suman.log.warning(chalk.yellow('note that Suman is not installed at all, you may wish to run "$ suman --init"'));
        }
    }
    try {
        require.resolve('suman-server');
        sumanServerInstalled = true;
    }
    catch (err) {
        sumanServerInstalled = false;
        if (opts.verbosity > 2) {
            _suman.log.info(chalk.yellow('note that "suman-server" package is not yet installed.'));
        }
    }
    return {
        sumanServerInstalled: sumanServerInstalled,
        sumanInstalledLocally: sumanInstalledLocally,
        sumanInstalledAtAll: sumanInstalledAtAll
    };
};
