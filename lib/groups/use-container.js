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

module.exports = function useContainer(strm, item, cb) {

  //TODO: maybe container does not need to be re-built
  debugGroups(' => Processing the following item => ', item);

  async.waterfall([

    function getExistingImage(cb) {

      var first = true;

      function race() {
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

    function buildContainer(data, cb) {

      debugGroups(' => data from check existing container => ', item);

      if (data && data.isContainerAlreadyBuilt) {
        // this means our image has already been built
        debugGroups(' => Container is already built => ', data);
        process.nextTick(cb);
      }
      else {

        debugGroups(' => Container is *not* already built....building...');
        const b = item.build();

        debugGroups(' => "Build" container command => ', '"' + b + '"');
        //TODO: need to check if bash is the right interpreter
        const n = cp.spawn('bash', [], {});

        n.stdin.setEncoding('utf8');
        n.stderr.setEncoding('utf8');
        n.stdout.setEncoding('utf8');

        n.stdin.write('\n' + b + '\n');   // <<< key part, you must use newline char

        process.nextTick(function () {
          n.stdin.end();
        });

        if(!global.sumanOpts.no_stream_to_console){
          n.stdout.pipe(process.stdout, {end: false});
          n.stderr.pipe(process.stderr, {end: false});
        }

        if(!global.sumanOpts.no_stream_to_file){
          n.stdout.pipe(strm, {end: false});
          n.stderr.pipe(strm, {end: false});
        }

        n.on('close', function (code) {
          console.log('EXIT CODE OF CONTAINER BUILD => ', code);
          cb(null, code);
        });

        // cp.exec(b, function (err, stdout, stderr) {
        //
        //   if (err || String(stderr).match(/error/i)) {
        //     return cb((err || '') + (stderr || ''));
        //   }
        //
        //   console.log(' => stdout => ', stdout);
        //   cb(null);
        //
        // });

      }

    },

    function runContainer(code, cb) {

      if (code > 0) {
        console.error(' => Exit code of container build command was greater than zero, so we are not running the container.');
        return process.nextTick(cb);
      }

      const r = item.run();

      //rmcd ~ run command
      // const rcmd = String(r).split(/\s+/);

      debugGroups(' => Run container command ', '"' + r + '"');

      // const child = cp.spawn(rcmd[0], rcmd.splice(1), {
      //   stdio: ['ignore', 'inherit', 'inherit']
      // });

      const child = cp.spawn('bash', [], {});

      child.stdin.setEncoding('utf8');
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');

      child.stdin.write('\n' + r + '\n');   // <<< key part, you must use newline char

      process.nextTick(function () {
        child.stdin.end();
      });

      if(!global.sumanOpts.no_stream_to_console){
        child.stdout.pipe(process.stdout, {end: false});
        child.stderr.pipe(process.stderr, {end: false});
      }

      if(!global.sumanOpts.no_stream_to_file){
        child.stdout.pipe(strm, {end: false});
        child.stderr.pipe(strm, {end: false});
      }


      child.on('close', function (code) {
        console.log('EXIT CODE OF CONTAINER RUN => ', code);
        cb(null, code);
      });
    }

  ], cb);

};
