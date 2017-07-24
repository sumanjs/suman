#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var lf = require('lockfile');
var chalk = require("chalk");
var sumanHome = path.resolve(process.env.HOME + '/.suman');
var globalDir = path.resolve(sumanHome + '/global');
var queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');
var lock = path.resolve(process.env.HOME + '/.suman/install-queue.lock');
function unlock(cb) {
    lf.unlock(lock, function (err) {
        err && console.error('\n', err.stack || err, '\n');
        cb && cb();
    });
}
var obj = {
    stale: 18000,
    wait: 20000,
    pollPeriod: 110,
    retries: 300,
    retryWait: 150
};
var queueWorkerLock = path.resolve(process.env.HOME + '/.suman/queue-worker.lock');
process.once('exit', function () {
    try {
        fs.unlinkSync(queueWorkerLock);
    }
    catch (err) {
        console.error(err.stack || err);
    }
});
exports.work = function (cb) {
    lf.lock(lock, obj, function (err) {
        if (err) {
            return unlock(cb);
        }
        fs.readFile(queue, 'utf8', function (err, data) {
            if (err) {
                console.error(err);
                unlock(cb);
            }
            else {
                var lines = String(data).split('\n').filter(function (l) {
                    return String(l).trim().length > 0;
                });
                var first_1 = String(lines[0] || '').trim();
                if (!first_1) {
                    console.log(' => Install queue is empty, we are done here.');
                    unlock(cb);
                }
                else {
                    console.log(' => Line / command to be run next => ', first_1);
                    console.log(' => number of npm install lines remaining before de-duping => ', lines.length, '\n');
                    var d = lines.filter(function (l) {
                        return String(l).trim() !== String(first_1).trim();
                    }).map(function (l) {
                        return String(l).trim();
                    });
                    var uniqueList = d.filter(function (elem, pos, arr) {
                        if (arr.indexOf(elem) === pos) {
                            return true;
                        }
                        else {
                            console.log(' => Suman postinstall message => Filtering out the following duplicate item from queue => \n', chalk.magenta(elem), '\n');
                        }
                    });
                    data = uniqueList.join('\n');
                    console.log(' => Suman postinstall message => number of npm install lines remaining *after* de-duping => ', uniqueList.length, '\n', ' first item => ', first_1, '\n');
                    fs.writeFile(queue, data, { mode: 511 }, function (err) {
                        if (err) {
                            console.error('\n', err.stack || err, '\n');
                        }
                        unlock();
                        var n = cp.spawn('bash', [], {
                            cwd: global.canInstallSumanGlobal ? globalDir : global.projectRoot
                        });
                        n.stdin.write('\n' + first_1 + '\n');
                        process.nextTick(function () {
                            n.stdin.end();
                        });
                        n.once('close', function () {
                            exports.work(cb);
                        });
                    });
                }
            }
        });
    });
};
