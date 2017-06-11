'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require('path');
var assert = require('assert');
var fs = require('fs');
var util = require('util');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var sumanUtils = require('suman-utils');
var constants = require('../../config/suman-constants').constants;
var loaded;
module.exports = function loadSharedObjects(pathObj, projectRoot, sumanOpts) {
    if (loaded) {
        return loaded;
    }
    if (sumanOpts.init) {
        return loaded = {};
    }
    var sumanHelpersDir = _suman.sumanHelperDirRoot;
    var logDir = pathObj.sumanLogDir;
    var sumanHelpersDirLocated = pathObj.sumanHelpersDirLocated;
    try {
        fs.statSync(logDir);
    }
    catch (err) {
        if (sumanHelpersDirLocated) {
            console.error('\n', colors.blue('=> Suman could successfully locate your "<suman-helpers-dir>", but...\n')
                + colors.yellow.bold(' ...Suman could not find the <suman-helpers-dir>/logs directory...you may have accidentally deleted it, ' +
                    'Suman will re-create one for you.'));
        }
        try {
            fs.mkdirSync(logDir);
        }
        catch (err) {
            console.error('\n\n', colors.red(' => Suman fatal problem => ' +
                'Could not create logs directory in your sumanHelpersDir,\n' +
                'please report this issue. Original error => \n' + (err.stack || err), '\n\n'));
            process.exit(constants.EXIT_CODES.COULD_NOT_CREATE_LOG_DIR);
        }
    }
    var integrantPreFn;
    try {
        integrantPreFn = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.once.pre.js'));
    }
    catch (err) {
        integrantPreFn = function () {
            console.error(' => Could not load your integrant pre module.');
            return {};
        };
        if (sumanOpts.verbosity > 2) {
            console.error('\n', colors.magenta('=> Suman usage warning: no suman.once.pre.js file found.'), '\n');
        }
        if (sumanOpts.verbosity > 3) {
            console.error('\n', colors.magenta(err.stack || err), '\n');
        }
        if (sumanOpts.strict) {
            process.exit(constants.EXIT_CODES.SUMAN_PRE_NOT_FOUND_IN_YOUR_PROJECT);
        }
    }
    var iocFn;
    try {
        iocFn = require(path.resolve(_suman.sumanHelperDirRoot + '/suman.ioc.js'));
    }
    catch (err) {
        try {
            iocFn = require(path.resolve(projectRoot + '/suman/suman.ioc.js'));
        }
        catch (err) {
            if (sumanHelpersDirLocated) {
                console.log('\n\n', colors.bgBlack.cyan('=> Suman tip => Create your own suman.ioc.js file ' +
                    'instead of using the default file.'), '\n');
            }
            iocFn = require('../default-conf-files/suman.default.ioc.js');
        }
    }
    try {
        assert(((integrantPreFn === undefined) || (typeof integrantPreFn === 'function')), 'Your suman.once.pre.js file needs to export a function.');
        assert((iocFn === undefined) || typeof iocFn === 'function', ' => Your suman.ioc.js file does not export a function. Please fix this situation.');
    }
    catch (err) {
        console.error('\n\n', colors.magenta(err.stack || err), '\n\n');
        process.exit(constants.EXIT_CODES.SUMAN_HELPER_FILE_DOES_NOT_EXPORT_EXPECTED_FUNCTION);
    }
    return loaded = {
        iocFn: _suman.sumanIoc = iocFn,
        integrantPreFn: _suman.integrantPreFn = integrantPreFn
    };
};
