"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var async = require("async");
var _ = require("lodash");
var su = require("suman-utils");
exports.run = function (projecRoot, paths, dest, isForce) {
    var pths = _.flattenDeep([paths]);
    console.log('paths => ', pths);
    async.mapLimit(pths, 5, function (p, cb) {
        if (!path.isAbsolute(p)) {
            p = path.resolve(projecRoot + '/' + p);
        }
        console.log('p => ', p);
        fs.stat(p, function (err, stats) {
            if (err) {
                return cb(null, {
                    error: err
                });
            }
            if (stats.isDirectory()) {
                return cb(null, {
                    error: "cannot convert directory: " + p
                });
            }
            if (stats.isFile()) {
                return cb(null, {
                    file: p
                });
            }
            return cb(null, {
                error: 'unknown problem, note that suman cannot currently convert symlinked files.'
            });
        });
    }, function (err, results) {
        if (err) {
            throw err;
        }
        var errors = results.filter(function (r) {
            return r.error;
        });
        if (errors.length > 0) {
            console.log(' => the following errors need to be resolved before converting your test files from Mocha to Suman.');
            errors.forEach(function (e) {
                console.log(e.error.stack || e.error);
            });
            return;
        }
        var files = results.filter(function (r) {
            return r.file;
        })
            .map(function (r) {
            return r.file;
        });
        console.log('The following files will be converted:');
        files.forEach(function (f) {
            console.log('f => ', f);
        });
        var mapped = su.removeSharedRootPath(files).map(function (fileArr) {
            return {
                originalPath: fileArr[0],
                mappedPath: path.resolve(dest + '/' + fileArr[1])
            };
        });
        console.log('mapped => ', mapped);
        async.eachLimit(mapped, 5, function (fileObj, cb) {
            mkdirp(path.dirname(fileObj.mappedPath), function (err) {
                if (err) {
                    return cb(err);
                }
                var writable = fs.createWriteStream(fileObj.mappedPath);
                writable.write("\nconst suman = require('suman');");
                writable.write('\nconst Test = suman.init(module);\n');
                writable.write('\nTest.create(function(describe, it, before, after, beforeEach, afterEach){\n\n');
                fs.createReadStream(fileObj.originalPath)
                    .pipe(writable)
                    .once('finish', function () {
                    console.log('ended and stuff');
                    fs.appendFile(fileObj.mappedPath, '\n\n});\n', cb);
                });
            });
        }, function (err) {
            if (err) {
                throw err;
            }
            console.log('all done converting.');
        });
    });
};
