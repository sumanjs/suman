'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const util = require('util');

//npm
const colors = require('colors/safe');
const watch = require('suman-watch');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////

module.exports = function (paths, sumanServerInstalled) {

  console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and run your tests on changes.');
  if (!_suman.sumanOpts.sparse) {
    console.log(' => Suman message => --watch option selected => Using the "watch" property object in your suman.conf.js file,' +
      'you can also configure Suman to do whatever you want based off a file change.');
  }

  if (!sumanServerInstalled) {
    throw new Error(colors.red(' => Suman server is not installed yet => Please run "$ suman --use-server" ' +
      'in your local project, to install the necessary dependencies, which will be saved to package.json.'));
  }
  else {

    if (paths.length > 1) {
      throw new Error(' => Suman usage error => Suman does not currently support using --watch for more than one path.')
    }
    else if (paths.length < 1) {
      throw new Error(' => Suman usage error => Please pass one argument for --watch which should match\n either (1) a' +
        ' given property on your "watch" object property in your suman.conf.js file, or (2) a watchable path on your filesystem.');
    }

    assert(typeof sumanConfig.watch === 'object',
      colors.red(' => Suman usage error => suman.conf.js needs a "watch" property that is an object.'));

    let obj;

    if (true || String(paths[0]).indexOf('//') > -1) {
      // console.log(' => Looking for property on "watch" named: ', paths[0]);
      // obj = sumanConfig['watch'][paths[0]];
      // if (!obj) {
      //   throw new Error(' => You have passed in a parameter to  the --watch option "' + paths[0] + '",\n' +
      //     ' but it did not match anything on the "watch" property in your suman.conf.js file,\n' +
      //     ' available options are:\n\n' + util.inspect(sumanConfig['watch']) + '\n\n');
      // }
      //
      // assert(typeof obj === 'object', 'watch["' + paths[0] + '"] needs to be an object with include/exclude/script properties.');
      //
      // assert(obj.script && obj.include && obj.exclude, 'Please define "script", "include", "exclude" on the "watch" ' +
      //   'property object in your suman.conf.js file.');

      watch({
        paths: paths
      }, function (err) {
        if (err) {
          console.error(err.stack || err);
          process.exit(1);
        }
        else {
          console.log(' => Suman watch successfully initialized.');
        }
      })

    }

  }
};
