'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');
const domain = require('domain');

//npm
const async = require('async');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////////

module.exports = function useContainer(strm, item, cb) {

  //TODO: maybe container does not need to be re-built
  const b = item.getPathToScript();

  console.log(colors.red.bold('path to script => ', b));
  const child = cp.spawn('sh', [b], {
    // stdio: ['ignore','inherit','inherit']
  });

  const d = domain.create();

  d.on('error', function (err) {
    console.log(' => User script error, in script with path => ', b, '\n', (err.stack || err));
  });

  strm.on('error', function (err) {
    console.log(' => User test script error, in script with path => ', b,
      '\n',
      colors.cyan(' Try running the script directly, if the error is not obvious.'),
      '\n',
      ' => Check the logs at <sumanHelpersDir>/logs/groups',
      '\n',
      colors.magenta(err.stack || err));
  });

  child.stdout.pipe(strm);
  child.stderr.pipe(strm);

  // d.run(function(){
  //   process.nextTick(function(){
  //     child.stdout.pipe(strm);
  //     child.stderr.pipe(strm);
  //   });
  // });


  child.on('close', function (code) {
    console.log('EXIT CODE => ', code);
    cb();
  });

};
