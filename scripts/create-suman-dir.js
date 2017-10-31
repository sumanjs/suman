#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var async = require("async");
var cwd = process.cwd();
var userHomeDir = path.resolve(process.env.HOME);
var sumanHome = path.resolve(userHomeDir + '/.suman');
var findSumanExec = path.resolve(sumanHome + '/find-local-suman-executable.js');
var sumanClis = path.resolve(sumanHome + '/suman-clis.sh');
var sumanGlobalConfig = path.resolve(sumanHome + '/suman.global.conf.json');
var sumanCompletion = path.resolve(sumanHome + '/suman-completion.sh');
var findProjectRootDest = path.resolve(sumanHome + '/find-project-root.js');
var sumanDebugLog = path.resolve(sumanHome + '/logs/suman-postinstall-debug.log');
var dbPath = path.resolve(sumanHome + '/database/exec_db');
var createTables = path.resolve(__dirname + '/create-tables.sh');
var queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');
var logInfo = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var data = Array.from(args).join(' ');
    try {
        fs.appendFileSync(sumanDebugLog, data);
    }
    catch (err) {
        console.error(err.message || err);
    }
};
logInfo(' => In Suman postinstall script, cwd => ', cwd);
logInfo(' => In Suman postinstall script => ', __filename);
logInfo(' => Suman home dir path => ', sumanHome);
logInfo(' => Suman post-install script run on ' + new Date() + ', from directory (cwd) =>');
logInfo(cwd);
var runDatabaseInstalls = function (err) {
    var logerr = false;
    if (err) {
        logInfo(' => Suman post-install initial routine experienced an error =>');
        logInfo(String(err.stack || err));
    }
    var n = cp.spawn('bash', [createTables], {
        env: Object.assign({}, process.env, {
            SUMAN_DATABASE_PATH: dbPath
        })
    });
    n.stderr.setEncoding('utf8');
    n.stderr.on('data', logInfo);
    n.stderr.pipe(process.stderr);
    n.once('close', function (code) {
        n.unref();
        if (code > 0) {
            console.error(' => Suman SQLite routine completed with a non-zero exit code.');
        }
        try {
            if (fs.existsSync(sumanHome)) {
            }
            else {
                console.error(' => Warning => ~/.suman dir does not exist!');
            }
        }
        catch (err) {
            console.error(err.stack || err);
        }
        finally {
            process.exit(0);
        }
    });
};
var wrapErr = function (cb, fn) {
    return function (err) {
        if (err)
            return cb(err);
        return fn.apply(this, Array.from(arguments).slice(1));
    };
};
async.parallel({
    updateSumanClis: function (cb) {
        var p = path.resolve(__dirname + '/suman-clis.sh');
        fs.readFile(p, wrapErr(cb, function (data) {
            fs.writeFile(sumanClis, data, { flag: 'w', mode: 511 }, cb);
        }));
    },
    createGlobalConfigFile: function (cb) {
        var p = path.resolve(__dirname + '/suman.global.conf.json');
        fs.readFile(p, wrapErr(cb, function (data) {
            fs.writeFile(sumanGlobalConfig, data, { flag: 'wx', mode: 511 }, function (err) {
                if (err && !/EEXIST/i.test(String(err.message))) {
                    return cb(err);
                }
                cb(null);
            });
        }));
    },
    updateSumanCompletion: function (cb) {
        var p = path.resolve(__dirname + '/suman-completion.sh');
        fs.readFile(p, wrapErr(cb, function (data) {
            fs.writeFile(sumanCompletion, data, { flag: 'w', mode: 511 }, cb);
        }));
    },
    updateFindSumanExec: function (cb) {
        var p = path.resolve(__dirname + '/find-local-suman-executable.js');
        fs.readFile(p, wrapErr(cb, function (data) {
            fs.writeFile(findSumanExec, data, { flag: 'w', mode: 511 }, cb);
        }));
    },
    appendToQueue: function (cb) {
        fs.appendFile(queue, '', cb);
    },
    updateFindProjectRoot: function (cb) {
        var p = path.resolve(__dirname + '/find-project-root.js');
        fs.readFile(p, wrapErr(cb, function (data) {
            fs.writeFile(findProjectRootDest, data, { flag: 'w', mode: 511 }, cb);
        }));
    }
}, function (err) {
    err && console.error(err.stack || err);
    try {
        if (!fs.existsSync(sumanHome)) {
            console.error(' => Warning => ~/.suman dir does not exist!');
        }
    }
    catch (err) {
        console.error(err.stack || err);
    }
    finally {
        process.exit(0);
    }
});
