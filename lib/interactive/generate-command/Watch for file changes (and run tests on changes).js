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
const localOrGlobal = require('../helpers/local-or-global-suman');
const choices = require('../helpers/choices');
const getOptions = require('../helpers/available-options');
const filteredOptions = require('../helpers/return-filtered-opts');
const watchHelper = require('../helpers/watch-helper');
const iu = require('../helpers/interactive-utils');
const startGenerateCommand = require('../helpers/start-generate-command');

/////////////////////////////////////////////////////////////

const opts = [
  'verbose',
  'sparse',
  'match-any',
  'match-none',
  'match-all'
];

const availableOptionsForPlainNode = filteredOptions(opts);

////////////////////////////////////////////////////////////

function run (rootDir) {

  return watchHelper().then(function (answers) {

    _interactiveDebug('=> answers from watch helper => ', answers);

    const mustInstallSumanServer = 'confirmNoSumanServerInstalled' in answers;
    const allowChoose = answers.useConfigWatchPresets !== 'yes';
    const watchProperty = answers.useConfigWatchPresets === 'yes' ? answers.watchPresetProperty : '';

    return chooseDirs({

      allowChoose: allowChoose,
      originalRootDir: rootDir,
      onlyOneFile: false

    }).then(function (pathsToRun) {

      if (allowChoose) {
        assert(pathsToRun.length > 0, ' You need to select at least one path.');
        pathsToRun = iu.mapDirs(pathsToRun);
      }

      return {
        watchProperty: watchProperty,
        mustInstallSumanServer: mustInstallSumanServer,
        pathsToRun: pathsToRun
      }
    });

  }).then(function (obj) {

    return getOptions(availableOptionsForPlainNode).then(function (answers) {
      return Object.assign(obj, {
        selectedOpts: answers[ 'command-line-options' ] || _implementationError(answers)
      })
    });

  }).then(function (obj) {

    return localOrGlobal().then(function (answers) {
      return Object.assign(obj, {
        localOrGlobal: answers.localOrGlobal || _implementationError(answers)
      });
    });

  }).then(function (obj) {

    const sumanExec = iu.mapSumanExec('suman', obj.localOrGlobal);
    const mustInstallSumanServer = obj.mustInstallSumanServer;
    const watchProperty = obj.watchProperty;
    const selectedOpts = obj.selectedOpts;
    const pathsToRun = obj.pathsToRun;

    //TODO: because transpile:true in your suman.conf.js file, --transpile is redundant

    if (mustInstallSumanServer) {
      console.log(' Note that because suman-server package is not installed, we have to run' +
        ' $ suman --use-server (just once), before using any watch features.');
    }

    console.log('\n\n => All done here! The valid Suman command to run is =>');

    const s = mustInstallSumanServer ? (sumanExec + ' --use-server &&') : '';
    console.log(' => ', colors.magenta.bold([ '$', s, sumanExec, '--watch', watchProperty,
      pathsToRun, selectedOpts ].join(' ')));
    console.log('\n\n');

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  const opts = {
    msg: colors.yellow(' => To run multiple tests you will use the Suman runner which will ' +
      'run each test in a separate process.') +
    '\n Suman will automatically use the runner when you point Suman at multiple files, or a directory.\n\n'
    + colors.blue(' First we will give you the chance to select one or more files or directories to' +
      'run the runner against.\n' +
      ' If you select only one file, then you must use the --runner option to tell Suman to use the runner, ' +
      'instead of just a single process.') + '\n\n\n' +
    ' This utility will make sure you do it right, don\'t worry.' + '\n\n' +
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