'use striiict';

//core
const util = require('util');

//npm
const colors = require('colors/safe');
const sumanUtils = require('suman-utils/utils');

//project
const constants = require('../../config/suman-constants');


module.exports = function (dirs) {

  console.log('\n', colors.magenta.bold('=> Suman message => No test files were found in the directories provided, ' +
      'given the following regular expressions => '), '\n\n',
    colors.magenta([
      {
        matchAny: global.sumanMatchesAny
      },
      {
        matchNone: global.sumanMatchesNone
      },
      {
        matchAll: global.sumanMatchesAll
      }
    ].map(item => sumanUtils.padWithXSpaces(4) + util.inspect(item)).join('\n\n')));

    console.log(
    '\n\n',
    colors.gray.underline.bold('=> Suman searched the following dirs for test files that matched the above regex(es) =>') +'\n',
    dirs.map(d => '\t' + colors.cyan.bold(' => "' + String(d) + '"')).join('\n'), '\n\n');

  console.log('\n', colors.gray.bold('=> No test files found. In this case, the default is to exit with code 34. '));
  console.log(colors.gray.bold(' => To pass the tests even in this event use the' +
    ' "--exit-with-code-zero-if-no-test-files-matched" option, which is probably a bad idea.'),'\n');

  if (global.sumanOpts.recursive !== true) {
    console.log(colors.yellow.bold(' => (note that the "--recursive" option is *not* set to true => ' +
        'perhaps you intended to use this option to capture more tests?) '));
  }


  process.exit(constants.RUNNER_EXIT_CODES.NO_TEST_FILES_MATCHED_OR_FOUND);

};
