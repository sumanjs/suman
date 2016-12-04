'use striiiict';

//core
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const async = require('async');
const rimraf = require('rimraf');
const debug = require('suman-debug');

//project
const useContainer = require('./use-container');
const useSh = require('./use-sh');
const debugGroups = debug('s:groups');

///////////////////////////////////////////////////////////

module.exports = function (paths) {

  const projectRoot = global.projectRoot;
  const groupLogs = path.resolve(global.sumanHelperDirRoot + '/logs/groups');
  const p = path.resolve(global.sumanHelperDirRoot + '/suman.groups.js');

  debugGroups(' => path to suman.groups.js => ', p);

  const groupsFn = require(p);
  const groups = groupsFn().groups;

  async.series({

    rimraf: function (cb) {
      //TODO: if directory does not exist, handle that error
      rimraf(groupLogs, {}, cb);
    },

    mkdir: function (cb) {
      fs.mkdir(groupLogs, {}, cb);
    }

  }, function (err) {

    if (err) {
      throw err;
    }

    async.eachSeries(groups, function (item, cb) {

      const strm = fs.createWriteStream(path.resolve(groupLogs + '/' + item.name + '.log'));

      if (item.useContainer) {
        useContainer(strm, item, cb);
      }
      else {
        useSh(strm, item, cb);
      }

    }, function (err, results) {

      console.log('DONE => ', err ? (err.stack || err) : '');
      console.log('results => ', results ? results : '');

    });
  })

};