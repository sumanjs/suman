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
function runDatabaseInstalls(err) {
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
}
async.parallel([
    function (cb) {
        fs.readFile(require.resolve('./suman-clis.sh'), function (err, data) {
            if (err) {
                cb(err);
            }
            else {
                fs.writeFile(sumanClis, data, { mode: 511 }, cb);
            }
        });
    },
    function (cb) {
        fs.readFile(require.resolve('./suman-completion.sh'), function (err, data) {
            if (err) {
                cb(err);
            }
            else {
                fs.writeFile(sumanCompletion, data, { mode: 511 }, cb);
            }
        });
    },
    function (cb) {
        fs.readFile(require.resolve('./find-local-suman-executable.js'), function (err, data) {
            if (err) {
                cb(err);
            }
            else {
                fs.writeFile(findSumanExec, data, { mode: 511 }, cb);
            }
        });
    },
    function (cb) {
        fs.appendFile(queue, '', cb);
    },
    function (cb) {
        fs.readFile(require.resolve('./find-project-root.js'), function (err, data) {
            if (err) {
                cb(err);
            }
            else {
                fs.writeFile(findProjectRootDest, data, { mode: 511 }, cb);
            }
        });
    }
], function (err) {
    runDatabaseInstalls(err);
});
