'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var util = require('util');
var su = require('suman-utils');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
module.exports = function (configPath, opts) {
    var cwd = process.cwd();
    var projectRoot = _suman.projectRoot = (_suman.projectRoot || su.findProjectRoot(cwd));
    var sumanConfig, pth1, pth2;
    if (!(sumanConfig = _suman.sumanConfig)) {
        if (process.env.SUMAN_CONFIG) {
            sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
        }
        else {
            try {
                pth1 = path.resolve(path.normalize(cwd + '/' + configPath));
                sumanConfig = require(pth1);
            }
            catch (err) {
                try {
                    pth1 = null;
                    pth2 = path.resolve(path.normalize(projectRoot + '/suman.conf.js'));
                    sumanConfig = require(pth2);
                }
                catch (err) {
                    pth2 = null;
                    sumanConfig = _suman.sumanConfig = require('../default-conf-files/suman.default.conf');
                    console.error(' => Suman warning => Using default configuration, please use suman --init to create a suman.conf.js file in the ' +
                        'root of your project.');
                }
            }
            if (pth1 || pth2) {
                if (_suman.sumanOpts.verbosity > 8 || su.isSumanDebug()) {
                    console.log(' => Suman verbose message => Path of suman config used: ' + (pth1 || pth2), '\n', 'Value of suman config => ', util.inspect(sumanConfig));
                }
            }
        }
    }
    return _suman.sumanConfig = (_suman.sumanConfig || sumanConfig);
};
