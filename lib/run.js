'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var EE = require("events");
var cp = require("child_process");
var async = require("async");
var shuffle = require('lodash.shuffle');
var chalk = require("chalk");
var su = require("suman-utils");
var rimraf = require('rimraf');
var events = require('suman-events').events;
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
            _suman.log.warning('No test paths provided, defaulting to the "testSrcDir" property value in your <suman.conf.js> file.');
            paths = [testSrcDir];
        }
        else {
            _suman.log.warning('no "testSrcDir" property found in <suman.conf.js>, defaulting to "test" directory.');
            paths = [path.resolve(projectRoot + '/test')];
        }
    }
    if (su.vgt(4)) {
        _suman.log.info();
        _suman.log.info('Suman will attempt to load these test paths:');
        paths.forEach(function (p, i) {
            _suman.log.info(i + 1, p);
        });
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
                    require('suman-browser');
                }
                catch (err) {
                    delete require.cache['suman-browser'];
                    if (process.env.SUMAN_ENV === 'local') {
                        _suman.log.warning('since we are in development, we are linking suman-browser with "npm link suman-browser".');
                        cp.execSync('npm link suman-browser');
                    }
                    else {
                        throw new Error('You need to install "suman-browser", using `npm install -D suman-browser`.');
                    }
                }
                try {
                    var browser = sumanConfig['browser'];
                    assert(su.isObject(browser), '"browser" property on suman.conf.js needs to be an object.');
                    var entryPoints = browser['entryPoints'];
                    assert(Array.isArray(entryPoints), '"entryPoints" property needs to be an Array instance.');
                    var files = entryPoints.map(function (item) { return item.html; });
                    return process.nextTick(cb, null, { files: files });
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
            su.findSumanMarkers([
                '@run.sh',
                '@transform.sh',
                '@config.json'
            ], testDir, getFilesToRun.files, function (err, map) {
                if (err)
                    return cb(err);
                _suman.markersMap = map;
                cb(null);
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
            runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
            var p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
            mkdirp(p, 511, cb);
        }
    }, function complete(err, results) {
        if (err) {
            console.error('\n');
            _suman.log.error('Fatal problem occurred:');
            _suman.log.error(err.stack || err);
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
        rb.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);
        if (su.vgt(6) || sumanOpts.dry_run) {
            console.log(' ', chalk.bgCyan.magenta(' => Suman verbose message => ' +
                'Suman will execute test files from the following locations:'), '\n', files, '\n');
        }
        if (sumanOpts.dry_run || sumanOpts.$dryRun) {
            _suman.log.info('exiting here, because "--dry-run" option was used.');
            return process.exit(0);
        }
        if (sumanOpts.find_only || sumanOpts.$findOnly) {
            _suman.log.info('exiting here, because "--find-only" option was used.');
            return process.exit(0);
        }
        var d = domain.create();
        d.once('error', function (err) {
            console.error('\n');
            _suman.log.error(chalk.magenta('fatal error => ' + (err.stack || err) + '\n'));
            process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
        });
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
            d.run(function () {
                require('./runner-helpers/create-suman-runner').run({ runObj: obj });
            });
        }
    });
};
