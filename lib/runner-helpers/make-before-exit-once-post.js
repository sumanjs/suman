'use strict';

//core
const fs = require('fs');
const util = require('util');

//npm
const async = require('async');
const colors = require('colors/safe');
const _ = require('lodash');
const events = require('suman-events');
const sumanUtils = require('suman-utils/utils');

//project
const callbackOrPromise = require('../callback-or-promise');
const resultBroadcaster = global.resultBroadcaster = (global.resultBroadcaster || new EE());

//////////////////////////////////////////////////////////

module.exports = function (runnerObj, oncePosts, integrantHashKeyValsForSumanOncePost, allOncePostKeys, userData){

  return function beforeExitRunOncePost (cb) {

    if (!runnerObj.hasOncePostFile) {
      return process.nextTick(cb);
    }

    const flattenedAllOncePostKeys = _.uniq(_.flatten(allOncePostKeys));

    if (sumanUtils.isSumanDebug()) {
      console.error('integrantHashKeyValsForSumanOncePost =>', util.inspect(integrantHashKeyValsForSumanOncePost));
    }

    userData['suman.once.pre.js'] = integrantHashKeyValsForSumanOncePost;
    const oncePostModuleRet = runnerObj.oncePostModule.apply(null, [userData]);

    flattenedAllOncePostKeys.forEach(function (k) {
      //we store an integer for analysis/program verification, but only really need to store a boolean
      //for existing keys we increment by one, otherwise assign to 1
      oncePosts[k] = oncePosts[k] || oncePostModuleRet[k];

      if (typeof oncePosts[k] !== 'function') {

        console.log(' => Suman is about to conk out =>\n\n' +
          ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', oncePosts);

        throw new Error('\n' + colors.red(' => Suman usage warning => your suman.once.post.js ' +
            'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"'));

      }
    });

    const keys = Object.keys(oncePosts);
    if (keys.length) {
      console.log('\n');
      console.log(' => Suman message => Suman is now running the desired hooks in suman.once.post.js, which include => ' +
        '\n\t', colors.cyan(util.inspect(keys)));
    }

    async.eachSeries(keys, function (k, cb) {

      callbackOrPromise(k, oncePosts, cb);

    }, function (err) {
      if (err) {
        console.error(err.stack || err);
        cb(err);
      }
      else {
        console.log('\n\n', ' => Suman message => all suman.once.post.js hooks completed successfully...exiting...\n\n', '\n\n');
        process.nextTick(function () {
          cb(null);
        });
      }
    });

  }
};
