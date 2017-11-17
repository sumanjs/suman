'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var util = require("util");
var assert = require("assert");
var EE = require("events");
var chalk = require("chalk");
var includes = require('lodash.includes');
var async = require("async");
var JSONStdio = require("json-stdio");
var _suman = global.__suman = (global.__suman || {});
var su = require("suman-utils");
var constants = require('../../config/suman-constants').constants;
var events = require('suman-events').events;
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var writeStdoutToSumanShell = JSONStdio.initLogToStdout(su.constants.JSON_STDIO_SUMAN_SHELL);
exports.getFilePaths = function (dirs, cb) {
    var projectRoot = _suman.projectRoot, sumanOpts = _suman.sumanOpts;
    var isForce = sumanOpts.force;
    var isForceMatch = sumanOpts.force_match;
    var matchesAny = _suman.sumanMatchesAny;
    var matchesNone = _suman.sumanMatchesNone;
    var matchesAll = _suman.sumanMatchesAll;
    assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
    assert(Array.isArray(matchesNone), ' => Suman internal error => matchesNone is not defined as array type.');
    assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
    matchesNone.push(new RegExp(_suman.sumanHelperDirRoot));
    var isFindOnly = Boolean(sumanOpts.find_only);
    var files = [];
    var filesThatDidNotMatch = [];
    var nonJSFile = false;
    var doesMatchAll = function (filename) {
        if (isForceMatch) {
            return true;
        }
        return matchesAll.every(function (regex) {
            var val = String(filename).match(regex);
            if (!val) {
                filesThatDidNotMatch.push({
                    filename: filename,
                    regexType: 'matchAll',
                    regex: 'The filename did not match the following regex' +
                        ' and therefore was excluded => ' + [regex],
                });
            }
            return val;
        });
    };
    var doesMatchAny = function (filename) {
        if (isForceMatch) {
            return true;
        }
        var val = !matchesAny.every(function (regex) {
            return !String(filename).match(regex);
        });
        if (!val) {
            filesThatDidNotMatch.push({
                filename: filename,
                regexType: 'matchAny',
                message: 'The filename did not match any of the regex(es)',
                regexes: matchesAny.map(function (r) { return String(r).slice(1, -1); })
            });
        }
        return val;
    };
    var doesMatchNone = function (filename) {
        if (isForceMatch) {
            return true;
        }
        return matchesNone.every(function (r) {
            var val = !String(filename).match(r);
            if (!val) {
                filesThatDidNotMatch.push({
                    filename: filename,
                    regexType: 'matchNone',
                    message: 'The filename matched the included regex and was therefore excluded.',
                    regex: r,
                });
            }
            return val;
        });
    };
    (function runDirs(dirs, count, cb) {
        async.eachLimit(dirs, 5, function (dir, cb) {
            var _doesMatchNone = doesMatchNone(dir);
            if (!_doesMatchNone) {
                rb.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
                return process.nextTick(cb);
            }
            if (!path.isAbsolute(dir)) {
                dir = path.resolve(process.cwd() + '/' + dir);
            }
            fs.stat(dir, function (err, stats) {
                if (err) {
                    _suman.log.warning("warning: possibly a symlink (symlinks not yet supported) => \"" + err.message + "\".");
                    return cb();
                }
                var countIsGreaterThanMaxDepth = (count > sumanOpts.max_depth);
                var isStartingToBeRecursive = (count > 0 && !sumanOpts.recursive);
                if (stats.isDirectory() && !countIsGreaterThanMaxDepth && !isStartingToBeRecursive) {
                    fs.readdir(dir, function (err, items) {
                        if (err) {
                            console.error('\n', ' ', chalk.bgBlack.yellow(' => Suman presumes you wanted to run tests with/within the ' +
                                'following path => '), '\n ', chalk.bgBlack.cyan(' => "' + dir + '" '));
                            console.error(' ', chalk.magenta.bold(' => But this file or directory cannot be found.'));
                            console.error('\n', chalk.magenta(err.stack || err), '\n\n');
                            return cb(err);
                        }
                        var mappedItems = items.map(function (i) { return path.resolve(dir + '/' + i); });
                        runDirs(mappedItems, ++count, cb);
                    });
                }
                else if (stats.isFile()) {
                    var _doesMatchAny = doesMatchAny(dir);
                    var _doesMatchNone_1 = doesMatchNone(dir);
                    var _doesMatchAll = doesMatchAll(dir);
                    if (!_doesMatchAny) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_ANY), dir);
                        return process.nextTick(cb);
                    }
                    if (!_doesMatchNone_1) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_NONE), dir);
                        return process.nextTick(cb);
                    }
                    if (!_doesMatchAll) {
                        rb.emit(String(events.FILENAME_DOES_NOT_MATCH_ALL), dir);
                        return process.nextTick(cb);
                    }
                    var baseName = path.basename(dir);
                    if (path.extname(baseName) !== '.js') {
                        nonJSFile = true;
                        rb.emit(String(events.FILE_IS_NOT_DOT_JS), dir);
                    }
                    var file = path.resolve(dir);
                    if (!sumanOpts.allow_duplicate_tests && includes(files, file)) {
                        _suman.log.warning(chalk.magenta('warning => \n => The following filepath was requested to be run more' +
                            ' than once, Suman will only run files once per run! =>'), '\n', file, '\n\n ' +
                            chalk.underline(' => To run files more than once in the same run, use "--allow-duplicate-tests"'), '\n');
                    }
                    else {
                        isFindOnly && writeStdoutToSumanShell({ file: file });
                        files.push(file);
                    }
                    process.nextTick(cb);
                }
                else {
                    var msg = [
                        '\n',
                        ' => Suman message => You may have wanted to run tests in the following path:',
                        chalk.cyan(String(dir)),
                        '...but it is either a folder or is not a .js (or accepted file type) file, or it\'s a symlink',
                        'if you want to run *subfolders* you shoud use the recursive option -r',
                        '...be sure to only run files that constitute Suman tests, to enforce this we',
                        'recommend a naming convention to use with Suman tests, see: sumanjs.org\n\n'
                    ]
                        .filter(function (i) { return i; }).join('\n');
                    rb.emit(String(events.RUNNER_HIT_DIRECTORY_BUT_NOT_RECURSIVE), msg);
                    process.nextTick(cb);
                }
            });
        }, cb);
    })(dirs, 0, function (err) {
        if (err) {
            console.error('\n');
            _suman.log.error(chalk.red.bold('Error finding runnable paths:'));
            _suman.log.error(err.stack || util.inspect(err));
            return process.nextTick(cb, err);
        }
        if (sumanOpts.transpile && !sumanOpts.useBabelRegister) {
            files = files.map(function (item) {
                return su.mapToTargetDir(item).targetPath;
            });
        }
        filesThatDidNotMatch.forEach(function (val) {
            console.log('\n');
            _suman.log.info(chalk.bgBlack.yellow(' A file in a relevant directory ' +
                'did not match your regular expressions => '), '\n', util.inspect(val));
        });
        console.log();
        console.error();
        process.nextTick(cb, null, {
            files: files,
            nonJSFile: nonJSFile,
            filesThatDidNotMatch: filesThatDidNotMatch
        });
    });
};
exports.findFilesToRun = exports.getFilePaths;
