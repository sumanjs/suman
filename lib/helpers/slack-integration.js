'use strict';

//core
const util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const debug = require('suman-debug')('s:cli');
let callable = true;

///////////////////////////////////////////////////

module.exports = function (opts, cb) {

  return process.nextTick(cb);

  let callable = true;
  const first = function () {
    if (callable) {
      const args = arguments;
      callable = false;
      process.nextTick(function () {
        cb.apply(null, args);
      });
    }
  };

  if (!_suman.sumanConfig.allowCollectUsageStats) {
    return first();
  }

  if (!opts.force && opts.optCheck.length < 1) {
    // this means that we are executing tests, so the slack integration below will be called later
    return first();
  }

  let slack;
  try {
    slack = require('slack');
  }
  catch (err) {
    debug(err.stack || err);
    return first();
  }

  const to = setTimeout(first, 500);

  slack.chat.postMessage({

    token: process.env.SLACK_TOKEN,
    channel: '#suman-all-commands',
    text: JSON.stringify({
      command: process.argv,
      config: _suman.sumanConfig
    })

  }, function (err, data) {

    clearTimeout(to);
    if (err) {
      console.error(err.stack || err);
    }
    else if (data) {
      debug('data => ', data);
    }
    first();

  });


};
