'use strict';

//typescript
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import domain = require('domain');
import os = require('os');
import fs = require('fs');
import path = require('path');
import util = require('util');
import assert = require('assert');
import EE = require('events');
import cp = require('child_process');

//npm
import * as async from 'async';
const rimraf = require('rimraf');
import chalk from 'chalk';
const flattenDeep = require('lodash.flattendeep');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {runUseContainer} from './use-container';
import {runUseSh} from './use-sh';
import {constants} from '../../config/suman-constants';

///////////////////////////////////////////////////////////////////////////////////////

export const run = function (paths: Array<string>) {

  /// => paths are names of groups to run

  const {projectRoot, sumanOpts} = _suman;
  const groupLogs = path.resolve(_suman.sumanHelperDirRoot + '/logs/groups');
  const p = path.resolve(_suman.sumanHelperDirRoot + '/suman.groups.js');

  let isUseContainer = sumanOpts.use_container === true ? true : undefined;
  if (sumanOpts.no_use_container === true) {
    isUseContainer = false;
  }

  let isAllowReuseImage = sumanOpts.allow_reuse_image === true ? true : undefined;
  if (sumanOpts.no_allow_reuse_image === true) {
    isAllowReuseImage = false;
  }

  const groupsFn = require(p);
  let originalGroups;

  const _data = {};

  if (isUseContainer !== undefined) {
    _data.useContainer = isUseContainer;
  }

  if (isAllowReuseImage !== undefined) {
    _data.allowReuseImage = isAllowReuseImage;
  }

  let groups = originalGroups = groupsFn(_data).groups;

  if (paths && paths.length > 0) {

    console.log('\n', chalk.cyan(' => Suman message => Only the following groups will be run => ' +
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
      chalk.red.bold(' => Suman usage error => No suman group matched a name passed at the command line.'));
    console.error('\n\n',
      chalk.green.bold(' => Suman message => Available suman group names are =>  \n'
        + originalGroups.map(g => '\n => "' + g.name + '"')), '\n');

    return process.exit(constants.CLI_EXIT_CODES.NO_GROUP_NAME_MATCHED_COMMAND_LINE_INPUT);
  }

  async.series({

      rimraf: function (cb: Function) {
        //TODO: if directory does not exist, handle that error
        rimraf(groupLogs, cb);
      },

      mkdir: function (cb: Function) {
        fs.mkdir(groupLogs, cb);
      }

    },

    function (err: Error) {

      if (err) {
        throw err;
      }

      const concurrency = sumanOpts.concurrency || 1;
      console.log('\n', chalk.cyan(' => Suman message => Running suman groups with a --concurrency of => '
        + concurrency + ' '), '\n');

      if (!sumanOpts.concurrency) {
        console.log(chalk.yellow(' => You must explicitly set concurrency, using the suman groups feature, ' +
          'otherwise it defaults to 1.'));
      }

      const totalCount = groups.length;
      console.log(' => ', totalCount, ' Suman groups will be run.');
      let finishedCount = 0;

      async.mapLimit(groups, concurrency, function (item, cb: Function) {

        const logfile = path.resolve(groupLogs + '/' + item.name + '.log');
        const strm = fs.createWriteStream(logfile, {end: false});

        strm.on('error', function (err: Error) {
          console.log(' => User test script error, for item => ', util.inspect(item),
            '\n',
            chalk.cyan(' Try running the script directly, if the error is not obvious.'),
            '\n',
            ' => Check the logs at <suman-helpers-dir>/logs/groups',
            '\n',
            chalk.magenta(err.stack || err));
        });

        strm.write(' => Beginning of run.\n');
        console.log(chalk.bgGreen.black.bold(' => Suman message => Group name => ', item.name));

        if (item.useContainer) {
          console.log('\n', chalk.cyan(' => Suman => using container for item => ') +
            '\n' + chalk.blue(util.inspect(item)), '\n');
          runUseContainer(strm, item, function () {
            finishedCount++;
            console.log(' => Suman groups finished count => ', finishedCount, '/', totalCount);
            cb.apply(null, arguments);
          });
        }
        else {
          console.log('\n', chalk.cyan(' => Suman => running item directly => ') +
            '\n' + chalk.blue(util.inspect(item)), '\n');
          runUseSh(strm, item, function () {
            finishedCount++;
            console.log(' => Suman groups finished count => ', finishedCount, '/', totalCount);
            cb.apply(null, arguments);
          });
        }

      }, function (err: Error, results: Array<any>) {

        if (err) {
          console.log(' => Suman groups has errored-out => ', (err.stack || err));
          console.log(' => Suman groups is exiting with code 1');
          process.exit(1);
        }
        else {

          results = flattenDeep([results]);

          console.log('\n', chalk.cyan(' => Suman groups results => \n' +

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
