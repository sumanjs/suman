'use strict';

//core
const path = require('path');
const fs = require('fs');

//npm
const async = require('async');
const rimraf = require('rimraf');
const colors = require('colors/safe');
const util = require('util');
const flattenDeep = require('lodash.flattendeep');

//project
const _suman = global.__suman = (global.__suman || {});
const useContainer = require('./use-container');
const useSh = require('./use-sh');
const constants = require('../../config/suman-constants');
const debug = require('suman-debug')('s:groups', {
  force: true
});


///////////////////////////////////////////////////////////////////////////////////////

module.exports = function (paths) {

  /// paths is names of groups to run

  const projectRoot = _suman.projectRoot;
  const groupLogs = path.resolve(_suman.sumanHelperDirRoot + '/logs/groups');
  const p = path.resolve(_suman.sumanHelperDirRoot + '/suman.groups.js');

  debug(' => path to suman.groups.js => ', p);

  let isUseContainer = _suman.sumanOpts.use_container === true ? true : undefined;
  if (_suman.sumanOpts.no_use_container === true) {
    isUseContainer = false;
  }

  debug(' => Suman debug => isUseContainer', isUseContainer);

  let isAllowReuseImage = _suman.sumanOpts.allow_reuse_image === true ? true : undefined;
  if (_suman.sumanOpts.no_allow_reuse_image === true) {
    isAllowReuseImage = false;
  }

  debug(' => Suman debug => isAllowReuseImage', isAllowReuseImage);

  const groupsFn = require(p);
  let originalGroups;

  const _data = {};

  if(isUseContainer !== undefined){
    _data.useContainer = isUseContainer;
  }

  if(isAllowReuseImage !== undefined){
    _data.allowReuseImage = isAllowReuseImage;
  }


  let groups = originalGroups = groupsFn(_data).groups;

  if (paths && paths.length > 0) {

    console.log('\n', colors.cyan(' => Suman message => Only the following groups will be run => ' +
      paths.map(p => '\n => "' + p + '"')), '\n');

    groups = groups.filter(function (g) {
      return paths.indexOf(g.name) > -1;
    });

    groups.forEach(function (g) {
      console.log(' => Suman cli will execute group with name => "' + g.name + '"');
    });
  }

  if (groups.length < 1) {
    console.error('\n\n',
      colors.red.bold(' => Suman usage error => No suman group matched a name passed at the command line.'));
    console.error('\n\n',
      colors.green.bold(' => Suman message => Available suman group names are =>  \n'
      + originalGroups.map(g => '\n => "' + g.name + '"')), '\n');

    return process.exit(constants.CLI_EXIT_CODES.NO_GROUP_NAME_MATCHED_COMMAND_LINE_INPUT);
  }

  async.series({

      rimraf: function (cb) {
        //TODO: if directory does not exist, handle that error
        rimraf(groupLogs, {}, cb);
      },

      mkdir: function (cb) {
        fs.mkdir(groupLogs, {}, cb);
      }

    },

    function (err) {

      if (err) {
        throw err;
      }

      const concurrency = _suman.sumanOpts.concurrency || 1;
      console.log('\n', colors.cyan(' => Suman message => Running suman groups with a --concurrency of => '
        + concurrency + ' '), '\n');

      if(!_suman.sumanOpts.concurrency){
        console.log(colors.yellow(' => You must explicitly set concurrency, using the suman groups feature, ' +
          'otherwise it defaults to 1.'));
      }

      const totalCount = groups.length;
      console.log(' => ', totalCount,' Suman groups will be run.');
      let finishedCount = 0;

      async.mapLimit(groups, concurrency, function (item, cb) {

        const logfile = path.resolve(groupLogs + '/' + item.name + '.log');
        const strm = fs.createWriteStream(logfile, {end: false});

        strm.on('error', function (err) {
          console.log(' => User test script error, for item => ', util.inspect(item),
            '\n',
            colors.cyan(' Try running the script directly, if the error is not obvious.'),
            '\n',
            ' => Check the logs at <suman-helpers-dir>/logs/groups',
            '\n',
            colors.magenta(err.stack || err));
        });

        strm.write(' => Beginning of run.\n');
        console.log(colors.bgGreen.black.bold(' => Suman message => Group name => ', item.name));

        if (item.useContainer) {
          console.log('\n', colors.cyan(' => Suman => using container for item => ') +
            '\n' + colors.blue(util.inspect(item)), '\n');
          useContainer(strm, item, function(){
            finishedCount++;
            console.log(' => Suman groups finished count => ', finishedCount, '/',totalCount );
            cb.apply(null,arguments);
          });
        }
        else {
          console.log('\n', colors.cyan(' => Suman => running item directly => ') +
            '\n' + colors.blue(util.inspect(item)), '\n');
          useSh(strm, item, function(){
            finishedCount++;
            console.log(' => Suman groups finished count => ', finishedCount, '/',totalCount );
            cb.apply(null,arguments);
          });
        }

      }, function (err, results) {

        if (err) {
          console.log(' => Suman groups has errored-out => ', (err.stack || err));
          console.log(' => Suman groups is exiting with code 1');
          process.exit(1);
        }
        else {

          results = flattenDeep([results]);

          console.log('\n', colors.cyan(' => Suman groups results => \n' +

              results.map(function (r) {
                return '\n' + util.inspect(r);
              })),

            '\n');

          let exitCode = 0;

          results.forEach(function (data) {
            exitCode = Math.max(exitCode, data.code);
          });

          process.exit(exitCode);

        }

      });
    });

};
