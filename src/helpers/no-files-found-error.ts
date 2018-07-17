'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
import {constants} from '../config/suman-constants';

//////////////////////////////////////////////////////////////////////

export const noFilesFoundError = function (dirs: Array<string>) {
  
  console.log('\n');
  _suman.log.info(chalk.magenta.bold('No test files were found in the directories provided, ' +
    'given the following regular expressions => '), '\n\n',
    chalk.magenta([
      {
        matchAny: _suman.sumanMatchesAny
      },
      {
        matchNone: _suman.sumanMatchesNone
      },
      {
        matchAll: _suman.sumanMatchesAll
      }
    ].map(item => su.padWithXSpaces(4) + util.inspect(item)).join('\n\n')));
  
  console.log(
    '\n\n',
    chalk.gray.underline.bold('=> Suman searched the following dirs for test files that matched the above regex(es) =>') + '\n',
    dirs.map(d => '\t' + chalk.cyan.bold(' => "' + String(d) + '"')).join('\n'), '\n\n');
  
  console.log('\n', chalk.black.bold('=> No test files found. In this case, the default is to exit with code 34. '));
  console.log(chalk.black.bold(' => To allow Suman tests to "pass" even in this event, use the ' +
    chalk.magenta('"--exit-with-code-zero-if-no-test-files-matched"') + ' option, which is probably a bad idea.'), '\n');
  
  if (_suman.sumanOpts.recursive !== true) {
    console.log(chalk.yellow.bold(' => (note that the ' + chalk.magenta('"--recursive"') + ' option is not flagged to true => ' +
      'perhaps you intended to use this option to capture more tests?) '));
  }
  
  process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILES_MATCHED_OR_FOUND);
  
};
