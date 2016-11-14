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
const startGenerateCommand = require('../helpers/start-generate-command');
const iu = require('../helpers/interactive-utils');

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

  }).then(function (pathsToRun) {

    assert(pathsToRun.length > 0, ' You need to select at least one path.');

    return getOptions(availOptsForCoverage).then(function (answers) {
      return {
        pathsToRun: pathsToRun,
        options: answers[ 'command-line-options' ] || _implementationError(answers)
      }
    });

  }).then(function (obj) {
    return localOrGlobal().then(function (answers) {
      return Object.assign(obj, {
        localOrGlobal: answers.localOrGlobal || _implementationError(answers)
      })
    });

  }).then(function (obj) {

    const sumanExec = iu.mapSumanExec('suman', obj.localOrGlobal);
    var installIstanbul = '';

    var istanbulGlobalMessage = '';
    const istanbulGlobalInstallPath = String(cp.execSync('which istanbul')).replace('\n','');

    if (istanbulGlobalInstallPath.length) {
      istanbulGlobalMessage = ' => Istanbul is installed globally ("' + istanbulGlobalInstallPath + '"), however,\n'
    }

    try {
      require.resolve('istanbul');
    }
    catch (err) {
      console.log('\n\n', colors.red(istanbulGlobalMessage + '  => You should install "istanbul" locally to get coverage.\n' +
        '   The below command shows you how to take care of that; you just need to run --use-istanbul once.'));
      installIstanbul = sumanExec + ' --use-istanbul &&';
    }

    const pathsToRun = obj.pathsToRun;

    const selectedOpts = obj.options;
    iu.allDoneHere([ '$', installIstanbul, sumanExec, '--coverage', pathsToRun, selectedOpts ])

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  const opts = {
    msg: colors.yellow(' => To run coverage with Suman you can run coverage on multiple tests\n' +
      '  as you would expect and you can do so by running them with the runner or in separate processes' +
      ' without the runner.')
    + colors.blue('\n  First we will give you the chance to select one or more files or directories to' +
      'run the runner against.\n' +
      '  If you select only one file, then you must use the --runner option to tell Suman to use the runner, ' +
      'instead of just a single process.') + '\n\n\n' +
    ' Not to worry, this utility will make sure you do it right.' + '\n\n' +
    colors.green(' Please confirm.') + ' (To skip this message, use the --fast option).',
  };

  return startGenerateCommand(opts).then(function (answers) {

    if (answers.confirm) {
      return run(rootDir);
    }
    else {
      console.log(' Well, we are done here then. Please start over.');
    }

  }).catch(rejectionHandler);

};