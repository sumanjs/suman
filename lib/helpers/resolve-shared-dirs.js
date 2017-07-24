'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var global = require('suman-browser-polyfills/modules/global');
var process = require('suman-browser-polyfills/modules/process');
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var loaded;
exports.resolveSharedDirs = function (sumanConfig, projectRoot, sumanOpts) {
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
        console.error('\n\n', chalk.magenta('=> Suman could *not* locate your <suman-helpers-dir>; ' +
            'perhaps you need to update your suman.conf.js file, please see: ***'), '\n', chalk.cyan(' => http://sumanjs.org/conf.html'), '\n', ' => We expected to find your <suman-helpers-dir> here =>', '\n', chalk.bgBlack.cyan(sumanHelpersDir), '\n');
        console.log(' => Exiting because we could not locate the <suman-helpers-dir>,' +
            'given your configuration and command line options.');
        return process.exit(constants.EXIT_CODES.COULD_NOT_LOCATE_SUMAN_HELPERS_DIR);
    }
    var logDir = path.resolve(sumanHelpersDir + '/logs');
    var integPrePath = path.resolve(sumanHelpersDir + '/suman.once.pre.js');
    var integPostPath = path.resolve(sumanHelpersDir + '/suman.once.post.js');
    var testSrcDirDefined = !!sumanConfig.testSrcDir;
    var testTargetDirDefined = !!sumanConfig.testTargetDir;
    var testDir = process.env.TEST_DIR = _suman.testDir = path.resolve(projectRoot + '/' + (sumanConfig.testDir || 'test'));
    var testSrcDir = process.env.TEST_SRC_DIR = _suman.testSrcDir = path.resolve(projectRoot + '/' + (sumanConfig.testSrcDir || 'test'));
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
