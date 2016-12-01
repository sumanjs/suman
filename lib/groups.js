'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const async = require('async');

///////////////////////////////////////////////////////////

module.exports = function (paths) {

  const projectRoot = global.projectRoot;

  const p = path.resolve(global.sumanHelperDirRoot + '/suman.groups.js');

  console.log('path to suman.groups.js => ', p);

  const groupsFn = require(p);

  const groups = groupsFn().groups;

  // const b = groups().groups[ 0 ].build();
  // console.log(b);
  //
  // const r = groups().groups[ 0 ].run();
  // console.log(r);

  const strm = fs.createWriteStream('/Users/Olegzandr/WebstormProjects/oresoftware/suman/test/_suman/logs/groups.log');

  async.each(groups, function (item, cb) {

    const b = item.build();

    cp.exec(b, function (err, stdout, stderr) {

      if (err) {
        cb(err);
      }
      else {

        const r = item.run();

        console.log('first stdout:', stdout ? stdout : '(undefined)');
        console.error('first stderr:', stderr ? stderr : '(undefined)');

        const rcmd = String(r).split(/\s+/);

        console.log(rcmd);
        const child = cp.spawn('docker', rcmd.splice(1));

        child.stdout.pipe(strm);
        child.stderr.pipe(strm);
        child.on('close', cb);

      }

    });

  }, function (err, results) {

    console.log('DONE => ', err ? (err.stack || err) : '');
    console.log('results => ', results ? results : '');

  });

};
