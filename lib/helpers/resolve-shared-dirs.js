'use strict';
var global = require('suman-browser-polyfills/modules/global');
var process = require('suman-browser-polyfills/modules/process');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var util = require('util');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var su = require('suman-utils');
var constants = require('../../config/suman-constants').constants;
var loaded;
module.exports = function (sumanConfig, projectRoot, sumanOpts) {
    if (loaded) {
        return loaded;
    }
    if (sumanOpts.init) {
        return loaded = {};
    }
    var sumanHelpersDir, shd;
    if (shd = sumanOpts.suman_helpers_dir) {
        sumanHelpersDir = (path.isAbsolute(shd) ? shd : path.resolve(projectRoot + '/' + shd));
    }
    else {
        sumanHelpersDir = path.resolve(projectRoot + '/' + (sumanConfig.sumanHelpersDir || 'suman'));
    }
    var sumanHelpersDirLocated = false;
    try {
        fs.statSync(sumanHelpersDir);
        sumanHelpersDirLocated = true;
    }
    catch (err) {
        try {
            shd = path.resolve('./' + su.removePath(sumanHelpersDir, projectRoot));
            console.error('\n\n', colors.magenta('=> Suman could *not* locate your <suman-helpers-dir>; ' +
                'perhaps you need to update your suman.conf.js file, please see: ***'), '\n', colors.cyan('sumanjs.org/conf.html'), '\n', ' => We expected to find your <suman-helpers-dir> here =>', '\n', colors.bgBlack.cyan(shd), '\n', '...We will create a temporary suman helpers directory to keep things moving.');
            if (sumanOpts.verbosity > 7 || process.env.SUMAN_DEBUG === 'yes') {
                console.log(colors.red(err.stack || err));
            }
            if (sumanOpts.strict) {
                console.log(' => Exiting because you have used the --strict option and we could not locate the <suman-helpers-dir>\n' +
                    'given your configuration and command line options.');
                process.exit(constants.EXIT_CODES.COULD_NOT_LOCATE_SUMAN_HELPERS_DIR);
            }
            else {
                sumanHelpersDir = path.resolve(projectRoot + '/suman-' + Date.now());
                fs.mkdirSync(sumanHelpersDir);
                console.log(' ...Temporary <suman-helpers-dir> directory written here =>');
                console.log(colors.magenta(sumanHelpersDir));
                fs.writeFileSync(sumanHelpersDir + '/.readme-immediately', 'This (temporary) directory was created because you have yet to ' +
                    'create a suman helpers directory,\nor it was deleted. Suman expected to find your <suman-helpers-dir> here: ' +
                    '"' + sumanConfig.sumanHelpersDir + '". But suman did not find a directory at that path.\n' +
                    'When running "suman --init", a directory called "suman" is created at the ' +
                    'root of your project.\nYou can move this directory as desired, as long as you update suman.conf.js accordingly.\n' +
                    'Please see these instructions on how to remedy the situation:\n' +
                    '=> http://sumanjs.org/init.html');
            }
        }
        catch (err) {
            console.error(err.stack);
        }
    }
    var logDir = path.resolve(sumanHelpersDir + '/logs');
    var integPrePath = path.resolve(sumanHelpersDir + '/suman.once.pre.js');
    var integPostPath = path.resolve(sumanHelpersDir + '/suman.once.post.js');
    var transpileLogPath = process.env.SUMAN_TRANSPILE_LOG_PATH =
        path.resolve(sumanHelpersDir + '/logs/transpile.log');
    var testSrcDirDefined = !!sumanConfig.testSrcDir;
    var testTargetDirDefined = !!sumanConfig.testTargetDir;
    var testDir = process.env.TEST_DIR = _suman.testDir = path.resolve(projectRoot + '/' + (sumanConfig.testDir || 'test'));
    var testSrcDir = process.env.TEST_SRC_DIR = _suman.testSrcDir = path.resolve(projectRoot + '/' + (sumanConfig.testSrcDir || 'test'));
    var testTargetDir = process.env.TEST_TARGET_DIR = _suman.testTargetDir =
        testTargetDirDefined ? path.resolve(projectRoot + '/' + (sumanConfig.testTargetDir)) :
            path.resolve(testSrcDir + '/../' + 'test-target');
    var errStrmPath = path.resolve(sumanHelpersDir + '/logs/test-debug.log');
    var strmStdoutPath = path.resolve(sumanHelpersDir + '/logs/test-output.log');
    return loaded = Object.freeze({
        sumanHelpersDir: _suman.sumanHelperDirRoot = process.env.SUMAN_HELPERS_DIR_ROOT = sumanHelpersDir,
        sumanLogDir: _suman.sumanLogDir = logDir,
        integPrePath: _suman.integPrePath = integPrePath,
        integPostPath: _suman.integPostPath = integPostPath,
        sumanHelpersDirLocated: sumanHelpersDirLocated,
        testDebugLogPath: errStrmPath,
        testLogPath: strmStdoutPath
    });
};
