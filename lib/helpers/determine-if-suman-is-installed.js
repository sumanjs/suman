'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
module.exports = function (sumanConfig, opts) {
    var err1, err2, projectRoot = _suman.projectRoot, sumanInstalledLocally = false, sumanInstalledAtAll = false, sumanServerInstalled = false, sumanIsSymlinkedLocally = false;
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
        err1 = e;
    }
    finally {
        if (err1) {
            sumanInstalledLocally = false;
            if (opts.verbosity > 2) {
                console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed locally, you may wish to run "$ suman --init"'));
            }
        }
        else {
            if (opts.verbosity > 7) {
                console.log(' ' + colors.blue('=> Suman message => Suman appears to be installed locally.'));
            }
        }
    }
    try {
        require.resolve('suman');
        sumanInstalledAtAll = true;
    }
    catch (e) {
        err2 = e;
    }
    finally {
        if (err2) {
            sumanInstalledAtAll = false;
            if (!sumanIsSymlinkedLocally && opts.verbosity > 2) {
                console.log(' ' + colors.yellow('=> Suman message => note that Suman is not installed at all, you may wish to run "$ suman --init"'));
            }
        }
        else {
            if (opts.verbosity > 7) {
                console.log(' ' + colors.blue('=> Suman message => Suman appears to be installed locally.'));
            }
        }
    }
    try {
        require.resolve('suman-server');
        sumanServerInstalled = true;
    }
    catch (err) {
        sumanServerInstalled = false;
        if (opts.verbosity > 2) {
            console.log(' ' + colors.yellow('=> Suman verbose message => note that "suman-server" package is not yet installed.'));
        }
    }
    return {
        sumanServerInstalled: sumanServerInstalled,
        sumanInstalledLocally: sumanInstalledLocally,
        sumanInstalledAtAll: sumanInstalledAtAll
    };
};
