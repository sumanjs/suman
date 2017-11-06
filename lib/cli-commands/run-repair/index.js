'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require("fs");
var path = require("path");
var async = require("async");
var su = require("suman-utils");
var _suman = global.__suman = (global.__suman || {});
exports.run = function (opts) {
    var projectRoot = _suman.projectRoot;
    var testSrcDir = process.env.TEST_SRC_DIR;
    async.autoInject({
        chmod: function (cb) {
            var filesToFind = ['@run.sh', '@transform.sh', '@target', '@src'];
            su.findSumanMarkers(filesToFind, testSrcDir, [], function (err, map) {
                var keys = Object.keys(map);
                async.eachLimit(keys, 5, function (k, cb) {
                    var keys = Object.keys(map[k]);
                    async.each(keys, function (key, cb) {
                        var fileOrFolder = path.join(k, key);
                        _suman.log.info('Running 777 against this file/folder:', fileOrFolder);
                        fs.chmod(fileOrFolder, '511', cb);
                    }, cb);
                }, cb);
            });
        },
        postinstall: function (cb) {
            process.nextTick(cb);
        }
    }, function (err, results) {
        if (err) {
            throw err;
        }
        _suman.log.info('Results => ', results);
    });
};
