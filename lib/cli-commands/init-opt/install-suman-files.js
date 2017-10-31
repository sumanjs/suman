'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var chmodr = require('chmodr');
var debug = require('suman-debug');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../../config/suman-constants').constants;
var sumanUtils = require('suman-utils');
var debugInit = debug('s:init');
exports.writeSumanFiles = function (newSumanHelperDirAbsPath, prependToSumanConf, newSumanHelperDir, projectRoot) {
    return function installSumanFiles(cb) {
        async.autoInject({
            createSumanDir: function (cb) {
                fs.mkdir(newSumanHelperDirAbsPath, 511, cb);
            },
            copyDefaultFiles: function (createSumanDir, cb) {
                async.each([
                    {
                        src: 'default-conf-files/suman.default.conf.js',
                        dest: prependToSumanConf + 'suman.conf.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.ioc.static.js',
                        dest: newSumanHelperDir + '/suman.ioc.static.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.ioc.js',
                        dest: newSumanHelperDir + '/suman.ioc.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.order.js',
                        dest: newSumanHelperDir + '/suman.order.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.once.pre.js',
                        dest: newSumanHelperDir + '/suman.once.pre.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.once.post.js',
                        dest: newSumanHelperDir + '/suman.once.post.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.globals.js',
                        dest: newSumanHelperDir + '/suman.globals.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.hooks.js',
                        dest: newSumanHelperDir + '/suman.hooks.js'
                    },
                    {
                        src: 'default-conf-files/suman.default.readme',
                        dest: newSumanHelperDir + '/README.md'
                    }
                ], function (item, cb) {
                    fs.createReadStream(path.resolve(__dirname + '/../../' + item.src))
                        .pipe(fs.createWriteStream(path.resolve(projectRoot + '/' + item.dest)))
                        .once('error', cb).once('finish', cb);
                }, cb);
            },
            createLogsDir: function (createSumanDir, cb) {
                fs.mkdir(path.resolve(newSumanHelperDirAbsPath + '/logs'), 511, function (err) {
                    if (err) {
                        if (!String(err).match(/EEXIST/)) {
                            return cb(err);
                        }
                    }
                    var msg1 = 'Readme file here primarily for version control stability\n';
                    var msg2 = 'Suman recommends that you tail the files in this directory when you\'re developing tests => most useful thing to do is to tail the runner-debug.log when running tests with the Suman runner,' +
                        'this is because accessing the individual test errors is less transparent due to the nature of child-processes/subprocesses)';
                    var msg3 = msg1 + '\n' + msg2;
                    async.forEachOf([
                        'README.md',
                        'watcher-output.log',
                        'test-debug.log',
                        'server.log',
                        'runner-debug.log'
                    ], function (item, index, cb) {
                        var p = path.resolve(newSumanHelperDirAbsPath + '/logs/' + item);
                        fs.writeFile(p, index === 0 ? msg3 : msg2, cb);
                    }, cb);
                });
            },
            chownDirs: function (createLogsDir, createSumanDir, cb) {
                chmodr(newSumanHelperDirAbsPath, 511, cb);
            }
        }, cb);
    };
};
