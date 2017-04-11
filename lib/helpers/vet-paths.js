'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const path = require('path');
const util = require('util');

//npm
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
let loaded = false;

////////////////////////////////////////////////////////////////////

module.exports = function (paths) {

  if (loaded) {
    return;
  }
  else {
    loaded = true;
  }

  const projectRoot = _suman.projectRoot;

  paths.forEach(function (p) {

    p = path.isAbsolute(p) ? p : path.resolve(projectRoot + path.sep + p);

    const shared = su.findSharedPath(p, projectRoot);

    if (String(shared) !== String(projectRoot)) {
      if (!_suman.sumanOpts.fforce) {
        throw new Error('Looks like you issued the Suman command from the wrong directory, ' +
          'please cd to the relevant project.\n' +
          ' => It appears that you wanted to execute Suman on this path => "' + colors.magenta(p) + '"\n' +
          ' But your current working directory is => "' + colors.cyan(process.cwd()) + '"\n' +
          ' If you think this message is totally wrong and you\'d like to ignore it, use the --fforce option.\n' +
          ' However, most likely you will end up using the <suman-helpers-dir> from the wrong project\n' +
          ' and end up writing to log files in the wrong project.');
      }
    }
  });
};
