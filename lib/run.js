'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var domain = require("domain");
var fs = require("fs");
var path = require("path");
var EE = require("events");
var cp = require("child_process");
var async = require("async");
var shuffle = require('lodash.shuffle');
var colors = require('colors/safe');
var suman_utils_1 = require("suman-utils");
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
var find_suman_server_1 = require("./find-suman-server");
var findFilesToRun = require('./runner-helpers/get-file-paths').findFilesToRun;
var resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
var dbPth = path.resolve(process.env.HOME + '/.suman/database/exec_db');
var getIstanbulPath = require('./helpers/get-istanbul-exec-path.js');
exports.run = function (sumanOpts, paths, sumanServerInstalled, sumanVersion) {
    var logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
    var sumanCPLogs = path.resolve(logsDir + '/runs');
    debugger;
    var sql;
    try {
        sql = require('sqlite3').verbose();
    }
    catch (err) {
        console.error('\n', err.stack, '\n');
        console.error(colors.yellow.bold(' => Looks like Suman could not find "sqlite3" NPM dependency.'));
        console.error(' => Suman uses NODE_PATH to source heavier dependencies from a shared location.');
        console.error(' => If you use the suman command, NODE_PATH will be set correctly.');
        if (process.env.NODE_PATH) {
            _suman.logError('$NODE_PATH currently has this value => ', process.env.NODE_PATH);
        }
        else {
            _suman.logError('$NODE_PATH is currently ' + colors.yellow('*not*') + ' defined.');
        }
        _suman.logError('If for whatever reason you ran node against the suman cli.js file, ' +
            'then NODE_PATH may not be set correctly.');
        _suman.logError('Try "$ NODE_PATH=$NODE_PATH:~/.suman/global/node_modules node <your-file.js>"');
        _suman.logError('You may attempt to use the --force flag to overcome this obstacle. But better to resolve the underlying issue.');
        if (!sumanOpts.force) {
            return process.exit(1);
        }
    }
    var runId = _suman.runId = process.env.SUMAN_RUN_ID = null;
    var projectRoot = _suman.projectRoot;
    var timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
    var server = _suman.server = find_suman_server_1.findSumanServer(null);
    var testDir = process.env.TEST_DIR;
    var testSrcDir = process.env.TEST_SRC_DIR;
    var testTargerDir = process.env.TEST_TARGET_DIR;
    var makeSumanLog = process.env.MAKE_SUMAN_LOG = 'yes';
    var IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';
    require('./helpers/vet-paths').run(paths);
    if (paths.length < 1) {
        if (testSrcDir) {
            paths = [testSrcDir];
        }
        else {
            throw new Error(' => Suman usage error => No "testSrcDir" prop specified in config or by command line.');
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
        getIstanbulPath: function (cb) {
            if (sumanOpts.coverage) {
                getIstanbulPath(function (err, p) {
                    if (err)
                        return cb(err);
                    _suman.istanbulExecPath = p;
                    cb(null);
                });
            }
            else {
                process.nextTick(cb);
            }
        },
        mkdirs: function (cb) {
            async.series([
                function (cb) {
                    mkdirp(path.resolve(sumanHome + '/global'), cb);
                },
                function (cb) {
                    mkdirp(path.resolve(sumanHome + '/database'), cb);
                }
            ], cb);
        },
        rimrafLogs: function (cb) {
            fs.mkdir(sumanCPLogs, function (err) {
                if (err && !String(err).match(/EEXIST/i)) {
                    return cb(err);
                }
                async.parallel({
                    removeOld: function (cb) {
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
        npmList: function (cb) {
            return process.nextTick(cb);
            var callable = true;
            var to = setTimeout(first, 800);
            function first() {
                if (callable) {
                    clearTimeout(to);
                    callable = false;
                    cb.apply(null, arguments);
                }
            }
            var n = cp.spawn('npm', ['view', 'suman', 'version'], {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            n.on('close', first);
            n.stdout.setEncoding('utf8');
            n.stderr.setEncoding('utf8');
            n.stdout.on('data', function (data) {
                var remoteVersion = String(data).replace(/\s+/, '');
                var localVersion = String(sumanVersion).replace(/\s+/, '');
                if (callable && remoteVersion !== localVersion) {
                    console.log(colors.red(' => Newest Suman version in the NPM registry:', remoteVersion, ', current version =>', localVersion));
                }
                else {
                    console.log(colors.red(' => Good news, your Suman version is up to date with latest version on NPM'));
                }
            });
            n.stderr.on('data', function (data) {
                console.error(data);
            });
        },
        slack: function (cb) {
            if (!process.env.SLACK_TOKEN) {
                return process.nextTick(cb);
            }
            var callable = true;
            var first = function () {
                if (callable) {
                    clearTimeout(to);
                    callable = false;
                    cb.apply(null, arguments);
                }
            };
            var to = setTimeout(first, 200);
            var slack;
            try {
                slack = require('slack');
            }
            catch (err) {
                debug(err.stack);
                return process.nextTick(first);
            }
            slack.chat.postMessage({
                token: process.env.SLACK_TOKEN,
                channel: '#suman-all-commands',
                text: JSON.stringify({
                    command: process.argv,
                    config: _suman.sumanConfig
                })
            }, function (err) {
                clearTimeout(to);
                if (err) {
                    debug(err.stack || err);
                }
                first();
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
        transpileFiles: function (cb) {
            if (sumanOpts.transpile && !sumanOpts.useBabelRegister) {
                suman_utils_1.default.runTranspile(paths, sumanOpts, cb);
            }
            else {
                process.nextTick(cb);
            }
        },
        getFilesToRun: function (cb) {
            findFilesToRun(paths, function (err, obj) {
                if (err) {
                    return cb(err);
                }
                suman_utils_1.default.findSumanMarkers(['@run.sh', '@transform.sh'], testDir, obj.files, function (err, map) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        _suman.markersMap = map;
                        fs.writeFile(_suman.sumanHelperDirRoot + '/suman-map.json', JSON.stringify(map), function () {
                            cb(err, obj);
                        });
                    }
                });
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
            var callable = true;
            var first = function () {
                if (callable) {
                    callable = false;
                    cb.apply(this, arguments);
                }
            };
            function createDir(runId) {
                var p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
                fs.mkdir(p, 511, first);
            }
            if (!sql) {
                runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
                return createDir(runId);
            }
            var db = new sql.Database(dbPth, function (err) {
                if (err) {
                    return first(err);
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
                                console.log(' => Suman internal warning => "suman_run_id" rows length is greater than 1.');
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
            _suman.logError('fatal problem => ' + (err.stack || err), '\n');
            return process.exit(1);
        }
        if (suman_utils_1.default.vgt(9)) {
            console.log('=> Suman verbose message => "$ npm list -g" results: ', results.npmList);
        }
        function changeCWDToRootOrTestDir(p) {
            if (sumanOpts.cwd_is_root) {
                process.chdir(projectRoot);
            }
            else {
                process.chdir(path.dirname(p));
            }
        }
        var obj = results.getFilesToRun;
        var files = obj.files;
        var nonJSFile = !!obj.nonJSFile;
        if (files.length < 1) {
            return noFilesFoundError(paths);
        }
        var d = domain.create();
        d.once('error', function (err) {
            _suman.logError(colors.magenta('fatal error => \n' + (err.stack || err) + '\n'));
            process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
        });
        resultBroadcaster.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);
        if (suman_utils_1.default.vgt(2)) {
            console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
                'Suman will execute test files from the following locations:'), '\n', files, '\n');
        }
        if (IS_SUMAN_SINGLE_PROCESS && !sumanOpts.runner && !sumanOpts.coverage) {
            console.log(ascii.suman_slant, '\n');
            d.run(function () {
                changeCWDToRootOrTestDir(projectRoot);
                if (sumanOpts.rand) {
                    files = shuffle(files);
                }
                _suman.sumanSingleProcessStartTime = Date.now();
                require('./run-child-not-runner').run(suman_utils_1.default.removeSharedRootPath(files));
            });
        }
        else if (!sumanOpts.runner && !sumanOpts.coverage && files.length === 1 && suman_utils_1.default.checkStatsIsFile(files[0]) && !nonJSFile) {
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
