'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var util = require("util");
var path = require("path");
var cp = require("child_process");
var fs = require("fs");
var chalk = require("chalk");
var semver = require("semver");
var _suman = global.__suman = (global.__suman || {});
exports.makeHandleDifferentExecutables = function (projectRoot, sumanOpts, runnerObj) {
    var execFile = path.resolve(__dirname + '/../run-child.js');
    var istanbulExecPath = _suman.istanbulExecPath || 'istanbul';
    var isExe = function (stats) {
        if (process.platform === 'win32') {
            return true;
        }
        var mode = stats.mode, gid = stats.gid, uid = stats.uid;
        var isGroup = gid ? process.getgid && gid === process.getgid() : true;
        var isUser = uid ? process.getuid && uid === process.getuid() : true;
        return Boolean((mode & parseInt('0001', 8)) ||
            ((mode & parseInt('0010', 8)) && isGroup) ||
            ((mode & parseInt('0100', 8)) && isUser));
    };
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
        },
        handleRegularFile: function (file, shortFile, argz, cpOptions, cb) {
            var extname = path.extname(file);
            fs.open(file, 'r', function (err, fd) {
                if (err) {
                    return cb(err);
                }
                var b = Buffer.alloc(184);
                fs.read(fd, b, 0, 184, 0, function (err, bytesRead, buf) {
                    if (err) {
                        return cb(err);
                    }
                    fs.stat(file, function (err, stats) {
                        if (err) {
                            return cb(err);
                        }
                        var isExecutable = isExe(stats);
                        var n, hasHasbang = String(buf).startsWith('#!'), firstLine = String(String(buf).split('\n')[0]).trim(), hashbangIsNode = hasHasbang && firstLine.match(/node$/);
                        if (!hasHasbang) {
                            _suman.log.warning();
                            _suman.log.warning('The following file is missing a hashbang.');
                            _suman.log.warning(file);
                        }
                        if (extname === '.js') {
                            if (hasHasbang && !hashbangIsNode) {
                                _suman.log.warning('The following test file with a ".js" extension has a hashbang which is not "node".');
                                _suman.log.warning('Hashbang: ', chalk.bold.black(firstLine));
                                _suman.log.warning('File:', file);
                            }
                            if (sumanOpts.coverage) {
                                var coverageDir = path.resolve(_suman.projectRoot + '/coverage/' + String(shortFile).replace(/\//g, '-'));
                                var argzz = ['cover', execFile, '--dir', coverageDir, '--'].concat(argz);
                                n = cp.spawn(istanbulExecPath, argzz, cpOptions);
                            }
                            else if (hasHasbang && !hashbangIsNode) {
                                _suman.log.warning();
                                _suman.log.warning('The following file has a ".js" extension but appears to have a hashbang which is not the node executable:');
                                _suman.log.warning('Hashbang: ', firstLine);
                                _suman.log.warning('File:', file);
                                _suman.log.info();
                                _suman.log.info("perl bash python or ruby file? '" + chalk.magenta(file) + "'");
                                var onSpawnError = function (err) {
                                    if (err && String(err.message).match(/EACCES/i)) {
                                        _suman.log.warning();
                                        _suman.log.warning("Test file with the following path may not be executable, or does not have the right permissions:");
                                        _suman.log.warning(chalk.magenta(file));
                                        _suman.log.warning(chalk.gray('fs.Stats for this file were:'), util.inspect(stats));
                                    }
                                    else if (err) {
                                        _suman.log.error(err.message || err);
                                    }
                                };
                                if (!isExecutable) {
                                    _suman.log.error('not executable: ', file);
                                }
                                try {
                                    n = cp.spawn(file, argz, cpOptions);
                                    n.usingHashbang = true;
                                }
                                catch (err) {
                                    onSpawnError(err);
                                    return cb(err, n);
                                }
                                if (!isExecutable) {
                                    n.once('error', onSpawnError);
                                }
                            }
                            else {
                                var execArgz_1 = ['--expose-gc'];
                                if (sumanOpts.debug_child) {
                                    execArgz_1.push('--debug=' + (5303 + runnerObj.processId++));
                                    execArgz_1.push('--debug-brk');
                                }
                                if (sumanOpts.inspect_child) {
                                    if (semver.gt(process.version, '7.8.0')) {
                                        execArgz_1.push('--inspect-brk=' + (5303 + runnerObj.processId++));
                                    }
                                    else {
                                        execArgz_1.push('--inspect=' + (5303 + runnerObj.processId++));
                                        execArgz_1.push('--debug-brk');
                                    }
                                }
                                var execArgs = void 0;
                                if (execArgs = sumanOpts.exec_arg) {
                                    execArgs.forEach(function (v) {
                                        v && execArgz_1.push(String(v).trim());
                                    });
                                    String(execArgs).split(/S+/).forEach(function (n) {
                                        n && execArgz_1.push('--' + String(n).trim());
                                    });
                                }
                                var $execArgz = execArgz_1.filter(function (e, i) {
                                    if (execArgz_1.indexOf(e) !== i) {
                                        _suman.log.error(chalk.yellow(' => Warning you have duplicate items in your exec args => '), '\n' + util.inspect(execArgz_1), '\n');
                                    }
                                    return true;
                                });
                                argz.unshift(execFile);
                                var argzz = $execArgz.concat(argz);
                                n = cp.spawn('node', argzz, cpOptions);
                            }
                        }
                        else {
                            var onSpawnError = function (err) {
                                if (err && String(err.message).match(/EACCES/i)) {
                                    _suman.log.warning();
                                    _suman.log.warning("Test file with the following path may not be executable, or does not have the right permissions:");
                                    _suman.log.warning(chalk.magenta(file));
                                    _suman.log.warning(chalk.gray('fs.Stats for this file were:'), util.inspect(stats));
                                }
                                else if (err) {
                                    _suman.log.error(err.message || err);
                                }
                            };
                            _suman.log.info();
                            _suman.log.info("perl bash python or ruby file? '" + chalk.magenta(file) + "'");
                            try {
                                n = cp.spawn(file, argz, cpOptions);
                                n.usingHashbang = true;
                            }
                            catch (err) {
                                onSpawnError(err);
                                return cb(err, n);
                            }
                            if (!isExecutable) {
                                n.once('error', function () {
                                    _suman.log.warning("Test file with the following path may not be executable:");
                                    _suman.log.warning(chalk.magenta(file));
                                    _suman.log.warning('fs.Stats for this file were:\n', util.inspect(stats));
                                });
                            }
                        }
                        cb(null, n);
                    });
                });
            });
        }
    };
};
