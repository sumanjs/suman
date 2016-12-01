'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const async = require('async');
const colors = require('colors/safe');

////////////////////////////////////////////////////////////////////////////

module.exports = function useContainer (item, cb) {

  const strm = fs.createWriteStream('/Users/Olegzandr/WebstormProjects/oresoftware/suman/test/_suman/logs/groups.log');

  //TODO: maybe container does not need to be re-built
  const b = item.getPathToScript();

  console.log(colors.red.bold('path to script => ', b));
  const child = cp.spawn('sh', [b]);

  child.stdout.pipe(strm);
  child.stderr.pipe(strm);
  child.on('close', function (code) {
    console.log('EXIT CODE => ', code);
    cb();
  });

};
