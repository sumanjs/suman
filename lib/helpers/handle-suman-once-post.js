'use strict';

//core
const util = require('util');

//npm
const flattenDeep = require('lodash.flattendeep');

//project
const _suman = global.__suman = (global.__suman || {});
const oncePost = require('../once-post');

/////////////////////////////////////////////////////////////////////////

let oncePostInvoked = false;

module.exports = function oncePostFn (cb) {
  if (!oncePostInvoked) {
    oncePostInvoked = true;
    oncePost(flattenDeep(_suman.oncePostKeys), _suman.userData, function (err, results) {
      if (err) {
        console.error(err.stack || err);
      }
      if (Array.isArray(results)) {  // once-post was actually run this time versus (see below)
        results.filter(r => r).forEach(function (r) {
          console.error(r.stack || r);
        });
      }
      else {
        console.log('Results is not an array... =>', results);
      }
      process.nextTick(cb);
    });
  }
  else {
    process.nextTick(function () {
      cb(new Error(' => Suman warning => oncePostFn was called more than once =>'));
    });
  }
};
