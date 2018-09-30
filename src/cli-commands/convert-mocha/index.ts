//core
import fs = require('fs');
import path = require('path');

//npm
import mkdirp = require('mkdirp');
import async = require('async');
import _ = require('lodash');
import su = require('suman-utils');

///////////////////////////////////////////////////////////

export const run = function (projecRoot: string, paths: Array<string>, dest: string, isForce: boolean) {

  // we should create a routine that wraps Mocha tests
  // in the suman wrapper

  const pths = su.flattenDeep([paths]);
  console.log('paths => ', pths);

  async.mapLimit(pths, 5, function (p: string, cb: Function) {

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
          error: `cannot convert directory: ${p}`
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

  }, function (err: Error, results: Array<Object>) {

    if (err) {
      throw err;
    }

    const errors = results.filter(function (r) {
      return r.error;
    });

    if (errors.length > 0) {
      console.log(' => the following errors need to be resolved before converting your test files from Mocha to Suman.');
      errors.forEach(function (e) {
        console.log(e.error.stack || e.error);
      });
      return;
    }

    const files = results.filter(function (r) {
      return r.file;
    })
    .map(function (r) {
      return r.file;
    });

    console.log('The following files will be converted:');

    files.forEach(function (f) {
      console.log('f => ', f);
    });

    const mapped = su.removeSharedRootPath(files).map(function (fileArr: Array<string>) {
      return {
        originalPath: fileArr[0],
        mappedPath: path.resolve(dest + '/' + fileArr[1])
      }
    });

    console.log('mapped => ', mapped);

    async.eachLimit(mapped, 5, function (fileObj: Object, cb: Function) {

      mkdirp(path.dirname(fileObj.mappedPath), function (err: Error) {

        if (err) {
          return cb(err);
        }

        const writable = fs.createWriteStream(fileObj.mappedPath);
        writable.write("\nconst suman = require('suman');");
        writable.write('\nconst Test = suman.init(module);\n');
        writable.write('\nTest.create(function(describe, it, before, after, beforeEach, afterEach){\n\n');

        fs.createReadStream(fileObj.originalPath)
        // .pipe(new ReplaceStream('bar','star'))
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
