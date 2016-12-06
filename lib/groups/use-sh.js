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

module.exports = function useContainer (strm, item, cb) {

  //TODO: maybe container does not need to be re-built
  const b = item.getPathToScript();

  console.log(colors.red.bold('path to script => ', b));
  const child = cp.spawn('sh', [ b ]);

  const d = domain.create();

  d.on('error', function(err){
      console.log(' => User script error, in script with path => ', b, '\n=> error =>', (err.stack || err));
  });

  d.run(function(){
    process.nextTick(function(){
      child.stdout.pipe(strm);
      child.stderr.pipe(strm);
    });
  });



  child.on('close', function (code) {
    console.log('EXIT CODE => ', code);
    cb();
  });

};
