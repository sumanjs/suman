'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var EE = require("events");
var async = require("async");
var shuffle = require('lodash.shuffle');
var chalk = require("chalk");
var su = require("suman-utils");
var rimraf = require('rimraf');
var events = require('suman-events').events;
var debug = require('suman-debug')('s:cli');
var uuid = require('uuid/v4');
var mkdirp = require('mkdirp');
var _suman = global.__suman = (global.__suman || {});
var sumanHome = path.resolve(process.env.HOME + '/.suman');
var noFilesFoundError = require('./helpers/no-files-found-error');
var ascii = require('./helpers/ascii');
var constants = require('../config/suman-constants').constants;
var findFilesToRun = require('./runner-helpers/get-file-paths').findFilesToRun;
var rb = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var dbPth = path.resolve(sumanHome + '/database/exec_db');
exports.run = function (sumanOpts, sumanConfig, paths) {
    var logsDir = sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
    var sumanCPLogs = path.resolve(logsDir + '/runs');
    debugger;
    var sql;
    try {
        sql = require('sqlite3').verbose();
    }
    catch (err) {
        console.error('\n', err.stack, '\n');
        console.error(chalk.yellow.bold(' => Looks like Suman could not find "sqlite3" NPM dependency.'));
        console.error(' => Suman uses NODE_PATH to source heavier dependencies from a shared location.');
        console.error(' => If you use the suman command, NODE_PATH will be set correctly.');
        if (process.env.NODE_PATH) {
            _suman.log.error('$NODE_PATH currently has this value => ', process.env.NODE_PATH);
        }
        else {
            _suman.log.error('$NODE_PATH is currently ' + chalk.yellow('*not*') + ' defined.');
        }
        _suman.log.error('If for whatever reason you ran node against the suman cli.js file, ' +
            'then NODE_PATH may not be set correctly.');
        _suman.log.error('Try "$ NODE_PATH=$NODE_PATH:~/.suman/global/node_modules node <your-file.js>"');
        _suman.log.error('You may attempt to use the --force flag to overcome this obstacle. But better to resolve the underlying issue.');
        if (!sumanOpts.force) {
            return process.exit(1);
        }
    }
    var runId = _suman.runId = process.env.SUMAN_RUN_ID = null;
    var projectRoot = _suman.projectRoot;
    var timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
    var testDir = process.env.TEST_DIR;
    var testSrcDir = process.env.TEST_SRC_DIR;
    var testTargerDir = process.env.TEST_TARGET_DIR;
    var makeSumanLog = process.env.MAKE_SUMAN_LOG = 'yes';
    var IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
    require('./helpers/general').vetPaths(paths);
    if (paths.length < 1) {
        if (testSrcDir) {
            paths = [testSrcDir];
        }
        else {
            throw new Error('Suman usage error => No "testSrcDir" prop specified in config or by command line.');
        }
    }
    async.autoInject({
        removeCoverageDir: function (cb) {
            if (sumanOpts.coverage) {
                var covDir_1 = path.resolve(_suman.projectRoot + '/coverage');
                rimraf(covDir_1, function () {
                    fs.mkdir(covDir_1, '511', cb);
                });
            }
            else {
                process.nextTick(cb);
            }
        },
        mkdirs: function (cb) {
            var makeFile = function (file) {
                return function (cb) {
                    mkdirp(file, cb);
                };
            };
            async.series([
                makeFile(path.resolve(sumanHome + '/global')),
                makeFile(path.resolve(sumanHome + '/database'))
            ], cb);
        },
        rimrafLogs: function (cb) {
            fs.mkdir(sumanCPLogs, function (err) {
                if (err && !String(err).match(/EEXIST/i)) {
                    return cb(err);
                }
                async.parallel({
                    removeOutdated: function (cb) {
                        fs.readdir(sumanCPLogs, function (err, items) {
                            if (err) {
                                return cb(err);
                            }
                            items.sort().reverse().splice(0, Math.min(items.length, 4));
                            async.each(items, function (item, cb) {
                                var pitem = path.resolve(sumanCPLogs + '/' + item);
                                rimraf(pitem, cb);
                            }, cb);
                        });
                    },
                    createNew: function (cb) {
                        return process.nextTick(cb);
                    }
                }, cb);
            });
        },
        checkIfTSCMultiWatchLock: function (cb) {
            fs.stat(path.resolve(projectRoot + '/suman-watch.lock'), function (err) {
                if (!err) {
                    _suman.multiWatchReady = true;
                }
                cb(null);
            });
        },
        getFilesToRun: function (cb) {
            if (sumanOpts.browser) {
                try {
                    var browser = sumanConfig['browser'];
                    assert(su.isObject(browser), '"browser" property on suman.conf.js needs to be an object.');
                    var entryPoints = browser['entryPoints'];
                    assert(Array.isArray(entryPoints), '"entryPoints" property needs to be an Array instance.');
                    var files = entryPoints.map(function (item) { return item.html; });
                    process.nextTick(cb, null, { files: files });
                    return;
                }
                catch (err) {
                    process.nextTick(cb, err);
                    return;
                }
            }
            else {
                findFilesToRun(paths, cb);
            }
        },
        findSumanMarkers: function (getFilesToRun, cb) {
            su.findSumanMarkers(['@run.sh', '@transform.sh', '@config.json'], testDir, getFilesToRun.files, function (err, map) {
                if (err) {
                    cb(err);
                }
                else {
                    _suman.markersMap = map;
                    cb(null);
                }
            });
        },
        conductStaticAnalysisOfFilesForSafety: function (cb) {
            if (false && sumanOpts.safe) {
                cb(new Error('safe option not yet implemented'));
            }
            else {
                process.nextTick(cb);
            }
        },
        getRunId: function (cb) {
            var first = su.once(this, cb);
            function createDir(runId) {
                var p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
                mkdirp(p, 511, first);
            }
            if (!sql) {
                runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
                return createDir(runId);
            }
            var db = new sql.Database(dbPth, function (err) {
                if (err) {
                    _suman.log.error(err.stack || err);
                    runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
                    return createDir(runId);
                }
                db.configure('busyTimeout', 4000);
                db.once('error', first);
                db.serialize(function () {
                    db.run('BEGIN EXCLUSIVE TRANSACTION;');
                    db.all('SELECT run_id from suman_run_id', function (err, rows) {
                        if (err) {
                            return first(err);
                        }
                        db.serialize(function () {
                            if (rows.length > 1) {
                                _suman.log.error('Suman internal warning => "suman_run_id" rows length is greater than 1.');
                            }
                            var val = rows[0] ? rows[0].run_id : 1;
                            runId = _suman.runId = process.env.SUMAN_RUN_ID = val;
                            var updatedValue = val + 1;
                            db.run('UPDATE suman_run_id SET run_id = ' + updatedValue);
                            db.run('COMMIT TRANSACTION;', function (err) {
                                db.close();
                                err ? first(err) : createDir(runId);
                            });
                        });
                    });
                });
            });
        }
    }, function complete(err, results) {
        if (err) {
            _suman.log.error('fatal problem => ' + (err.stack || err), '\n');
            return process.exit(1);
        }
        if (su.vgt(9)) {
            _suman.log.info('"$ npm list -g" results: ', results.npmList);
        }
        var changeCWDToRootOrTestDir = function (p) {
            if (sumanOpts.cwd_is_root || true) {
                process.chdir(projectRoot);
            }
            else {
                process.chdir(path.dirname(p));
            }
        };
        var obj = results.getFilesToRun;
        var files = obj.files;
        var nonJSFile = !!obj.nonJSFile;
        if (files.length < 1) {
            return noFilesFoundError(paths);
        }
        var d = domain.create();
        d.once('error', function (err) {
            console.error('\n');
            _suman.log.error(chalk.magenta('fatal error => ' + (err.stack || err) + '\n'));
            process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
        });
        rb.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);
        if (su.vgt(6) || sumanOpts.dry_run) {
            console.log(' ', chalk.bgCyan.magenta(' => Suman verbose message => ' +
                'Suman will execute test files from the following locations:'), '\n', files, '\n');
        }
        if (sumanOpts.dry_run || sumanOpts.$dryRun) {
            _suman.log.info('exiting here, because "--dry-run" option was used.');
            return process.exit(0);
        }
        var forceRunner = sumanOpts.browser || sumanOpts.runner || sumanOpts.coverage || sumanOpts.containerize;
        if (IS_SUMAN_SINGLE_PROCESS && !forceRunner) {
            console.log(ascii.suman_slant, '\n');
            d.run(function () {
                changeCWDToRootOrTestDir(projectRoot);
                if (sumanOpts.rand) {
                    files = shuffle(files);
                }
                _suman.sumanSingleProcessStartTime = Date.now();
                require('./run-child-not-runner').run(su.removeSharedRootPath(files));
            });
        }
        else if (!forceRunner && files.length === 1 && su.checkStatsIsFile(files[0]) && !nonJSFile) {
            console.log(ascii.suman_slant, '\n');
            d.run(function () {
                changeCWDToRootOrTestDir(files[0]);
                require('./run-child-not-runner').run(files);
            });
        }
        else {
            _suman.processIsRunner = true;
            var createRunner_1 = require('./runner-helpers/create-suman-runner').createRunner;
            d.run(function () {
                createRunner_1({ runObj: obj });
            });
        }
    });
};
