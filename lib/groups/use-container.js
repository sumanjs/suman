'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const colors = require('colors/safe');
const async = require('async');
const debug = require('suman-debug');

//project
const debugGroups = debug('s:groups');

////////////////////////////////////////////////////////////////////////////

module.exports = function useContainer (strm, item, cb) {

  //TODO: maybe container does not need to be re-built

  async.waterfall([

    function getExistingImage (cb) {

      var first = true;

      function race () {
        if (first) {
          first = false;
          cb.apply(null, arguments);
        }

      }

      setTimeout(function () {
        race(null, null);
      }, 3000);

      if (!item.allowReuseImage) {
        process.nextTick(function () {
          race(null, null);
        });
      }
      else {

        cp.exec('docker images -q ' + item.name + '  2> /dev/null',

          function (err, stdout, stderr) {

            if (err) {
              return race(err);
            }

            // (stderr should not be passed)
            race(null, {
              isContainerAlreadyBuilt: !!stdout,
              containerInfo: stdout
            });

          });
      }

    },

    function buildContainer (data, cb) {

      if (data) {
        // this means our image has already been built
        debugGroups(' => Container is already built => ', data);
        process.nextTick(cb);
      }
      else {

        debugGroups(' => Container is *not* already built....building...');

        const b = item.build();
        cp.exec(b, function (err, stdout, stderr) {

          if (err) {
            return cb(err);
          }

          console.log(' => stdout => ', stdout);
          cb(null);

        });
      }

    },

    function runContainer (cb) {

      const r = item.run();

      const rcmd = String(r).split(/\s+/);

      console.log(rcmd);
      const child = cp.spawn('docker', rcmd.splice(1));

      child.stdout.pipe(strm);
      child.stderr.pipe(strm);
      child.on('close', function (code) {
        console.log('EXIT CODE => ', code);
        cb();
      });
    }

  ], cb);

};
