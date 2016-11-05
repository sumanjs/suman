'use strict';

//core
const assert = require('assert');
const path = require('path');
const fs = require('fs');

module.exports = function (sumanServerInstalled) {

  console.log(' => Suman message => --watch option selected => Suman will watch files in your project, and your tests on changes.');

  if (!sumanServerInstalled) {
    throw new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" ' +
      'in your local project.\n ' + err3.stack);
  }
  else {

    if (paths.length > 1) {
      throw new Error(' => Suman usage error => Suman does not currently support using --watch for more than one path.')
    }
    else if (paths.length < 1) {
      throw new Error(' => Suman usage error => Please pass one argument for --watch which should match a' +
        ' given property on your "watch" object property in your suman.conf.js file, or a watchable path on your filesystem.');
    }

    assert(typeof sumanConfig.watch === 'object', 'suman.conf.js needs a "watch" property that is an object.');

    var obj;

    if (String(paths[ 0 ]).indexOf('//') > -1) {
      console.log(' => Looking for property on "watch" named: ', paths[ 0 ]);
      obj = sumanConfig[ 'watch' ][ paths[ 0 ] ];
      assert(obj.script && obj.include && obj.exclude, 'Please define "script", "include", "exclude"');
    }
    else {

      var pathToWatch = path.isAbsolute(paths[ 0 ]) ? paths[ 0 ] : path.resolve(root + '/' + paths[ 0 ]);

      console.log(' => Looking for file or dir on filesystem with path =', pathToWatch);
      try {
        fs.statSync(pathToWatch);
      }
      catch (e) {
        throw new Error(' => Path given by => "' + pathToWatch + '" does not seem to be a file or directory, if you intended ' +
          'to match a property on the "watch" object in your suman.conf.js file,' +
          ' that property needs to have at least one "//" character sequence');
      }

      obj = {
        script: './node_modules/.bin/suman ' + pathToWatch,
        exclude: [],
        include: []
      };
    }

    console.log('paths =>', paths, 'obj =>', obj);

    assert(typeof obj === 'object', 'watch["' + paths[ 0 ] + '"] needs to be an object with include/exclude/script properties.');

    require('../watching/watch-project')(obj, function (err) {
      if (err) {
        console.error(err.stack || err);
        process.exit(1);
      }
      else {
        console.log('\n\n\t => Suman server running locally now listening for files changes ' +
          'and will run and/or transpile tests for you as they change.');
        console.log('\n\n\t => Suman message => the ' + colors.magenta('--watch') + ' option is set, ' +
          'we are done here for now.');
        console.log('\t To view the options and values that will be used to initiate a Suman test run, ' +
          'use the --verbose or --vverbose options\n\n');
        process.exit(0);
      }
    });

  }
};