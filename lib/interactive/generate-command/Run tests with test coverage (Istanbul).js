'use striiiict';

//core
const assert = require('assert');
const util = require('util');
const cp = require('child_process');

//npm
const inquirer = require('inquirer');
const colors = require('colors/safe');

//project
const debug = require('debug')('suman:interactive');
const chooseDirs = require('../helpers/choose-dirs');
const sumanUtils = require('suman-utils/utils');
const rejectionHandler = require('../interactive-rejection-handler');
const choices = require('../helpers/choices');
const nodeOrSuman = require('../helpers/node-or-suman');
const getOptions = require('../helpers/available-options');
const filteredOptions = require('../helpers/return-filtered-opts');
const localOrGlobal = require('../helpers/local-or-global-suman');

/////////////////////////////////////////////////////////////

const opts = [
  'verbose',
  'sparse',
  'match-any',
  'match-none',
  'match-all'
];

const availOptsForCoverage = filteredOptions(opts);

////////////////////////////////////////////////////////////


function run (rootDir) {

  return chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: false

  }).then(function (dirs) {

    assert(dirs.length > 0, ' You need to select at least one path.');

    const pathsToRun = dirs.map(function (p) {
      return sumanUtils.removePath(p, global.projectRoot);
    }).join(' ');

    return getOptions(availOptsForCoverage).then(function (answers) {

      const selectedOpts = answers[ 'command-line-options' ];

      return localOrGlobal().then(function (val) {

        const sumanExec = choices.localOrGlobalChoices[ val.localOrGlobal ];
        console.log('\n\n => All done here! The valid Suman command to run is => \n');
        console.log(' => ', colors.magenta.bold(' $ ' + sumanExec + ' --coverage ' + pathsToRun + ' ' + selectedOpts.map(a => {
            return String(a).split(',')[ 0 ];
          }).join(' ')));
        console.log('\n\n');

      }).catch(rejectionHandler);

    });

  });

}

module.exports = function makePromise (rootDir) {

  return inquirer.prompt([
    {

      type: 'confirm',
      name: 'confirm',
      message: colors.yellow(' => To run coverage with Suman you can run coverage on multiple tests\n' +
        '  as you would expect and you can do so by running them with the runner or in separate processes' +
        ' without the runner.')
      + colors.blue('\n  First we will give you the chance to select one or more files or directories to' +
        'run the runner against.\n' +
        '  If you select only one file, then you must use the --runner option to tell Suman to use the runner, ' +
        'instead of just a single process.') + '\n\n\n' +
      ' Not to worry, this utility will make sure you do it right.' + '\n\n' +
      colors.green(' Please confirm.') + ' (To skip this message, use the --fast option).',
      when: function () {
        console.log(' ------------------------------------------------------- ');
        return true;
      }
    },

  ]).then(function (answers) {

    if (answers.confirm) {
      return run(rootDir);
    }
    else {
      console.log(' Well, we are done here then. Please start over.');
    }

  }).catch(rejectionHandler);

};