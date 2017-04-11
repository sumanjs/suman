'use strict';

//core
const path = require('path');
const os = require('os');
const fs = require('fs');

//npm
const colors = require('colors/safe');
const async = require('async');
const su = require('suman-utils');
const mkdirp = require('mkdirp');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function createTestFiles(paths) {

  const projectRoot = _suman.projectRoot || su.findProjectRoot(process.cwd());

  const p = path.resolve(__dirname, '..', 'default-conf-files/suman.skeleton.js');
  const strm = fs.createReadStream(p);

  async.each(paths, function (p, cb) {
    //TODO: difference between "finish" and "close" events on stream ??

    mkdirp(path.dirname(p), function (err) {
      if (err) {
        cb(err);
      }
      else {
        strm.pipe(fs.createWriteStream(p, {flags: 'wx'}))
          .once('error', cb)
          .once('finish', function () {
            console.log('\n => File was created:', p);
            process.nextTick(cb);
          });
      }
    });

  }, function (err) {
    console.log('\n');
    if (err) {
      console.error(colors.red.bold(' => Suman error => ') + colors.red(err.stack || err), '\n');
      process.exit(1);
    }
    else {
      console.log(colors.blue.bold(' => Suman message => successfully created test skeleton(s).'));
      process.exit(0);
    }
  });

};
