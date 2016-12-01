'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const async = require('async');

//project
const useContainer = require('./use-container');
const useSh = require('./use-sh');

///////////////////////////////////////////////////////////

module.exports = function (paths) {

  const projectRoot = global.projectRoot;
  const p = path.resolve(global.sumanHelperDirRoot + '/suman.groups.js');

  console.log('path to suman.groups.js => ', p);

  const groupsFn = require(p);
  const groups = groupsFn().groups;

  async.each(groups, function (item, cb) {

    //TODO: if item is already built, then do something else

    if (item.useContainer) {
      useContainer(item, cb);
    }
    else {
      useSh(item, cb);
    }

  }, function (err, results) {

    console.log('DONE => ', err ? (err.stack || err) : '');
    console.log('results => ', results ? results : '');

  });

};
