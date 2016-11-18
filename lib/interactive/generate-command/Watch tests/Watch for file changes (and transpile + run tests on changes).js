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
const chooseDirs = require('../../helpers/choose-dirs');
const sumanUtils = require('suman-utils/utils');
const rejectionHandler = require('../../interactive-rejection-handler');
const localOrGlobal = require('../../helpers/local-or-global-suman');
const choices = require('../../helpers/choices');
const getOptions = require('../../helpers/available-options');
const filteredOptions = require('../../helpers/return-filtered-opts');
const watchHelper = require('../../helpers/watch-helper');
const iu = require('../../helpers/interactive-utils');
const startGenerateCommand = require('../../helpers/start-generate-command');
const promiseReducer = require('../../helpers/promise-reducer');

/////////////////////////////////////////////////////////////

const opts = [
  'verbose',
  'sparse',
  'match-any',
  'match-none',
  'match-all'
];

const availableOpts = filteredOptions(opts);

////////////////////////////////////////////////////////////

const completeFns = [];

const fns = [

  function (cb) {
    return function (obj) {
      return watchHelper(obj, cb);
    }
  },

  function (cb) {
    return function (obj) {

      _interactiveDebug('=> answers from watch helper => ', obj);

      const mustInstallSumanServer = 'confirmNoSumanServerInstalled' in obj;
      const allowChoose = obj.useConfigWatchPresets !== 'yes';
      const watchProperty = obj.useConfigWatchPresets === 'yes' ? obj.watchPresetProperty : '';
      const rootDir = obj.rootDir;

      return chooseDirs({

        allowChoose: allowChoose,
        rootDir: rootDir,
        onlyOneFile: false

      }, cb).then(function (obj) {

        _interactiveDebug(' => AFTER chooseDirs => ', obj);

        if (allowChoose) {
          assert(obj.pathsToRun.length > 0, ' You need to select at least one path.');
        }

        return {
          watchProperty: watchProperty,
          mustInstallSumanServer: mustInstallSumanServer,
          pathsToRun: obj.pathsToRun,
          rootDir: rootDir
        }
      });
    }
  },

  function (cb) {
    return function (obj) {
      return getOptions(availableOpts, cb).then(function (answers) {
        return Object.assign(obj, {
          selectedOpts: answers[ 'command-line-options' ] || _implementationError(answers)
        })
      });
    }
  },

  function (cb) {
    return function (obj) {
      return localOrGlobal({}, cb).then(function (answers) {
        return Object.assign(obj, {
          localOrGlobal: answers.localOrGlobal || _implementationError(answers)
        });
      });

    }
  }

];

//////////////////////////////////////////////////////

function run (opts, cb) {

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');

  promiseReducer(run, opts, cb, fns, completeFns).then(function (obj) {

    const sumanExec = iu.mapSumanExec('suman', obj.localOrGlobal);
    const mustInstallSumanServer = obj.mustInstallSumanServer;
    const watchProperty = obj.watchProperty;

    const selectedOpts = obj.selectedOpts.map(function (a) {
      return a;
    }).join(' ');

    const pathsToRun = iu.mapDirs(obj.pathsToRun);

    if (mustInstallSumanServer) {
      console.log(' Note that because suman-server package is not installed, we have to run' +
        ' $ suman --use-server (just once), before using any watch features.');
    }

    const s = mustInstallSumanServer ? (sumanExec + ' --use-server &&') : '';
    iu.allDoneHere([ '$', s, sumanExec, '--transpile', '--watch', watchProperty,
      pathsToRun, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir, onBackspace) {

  const opts = {
    msg: colors.yellow(' => To run multiple tests you will use the Suman runner which will ' +
      'run each test in a separate process.') +
    '\n Suman will automatically use the runner when you point Suman at multiple files, or a directory.\n\n'
    + colors.blue(' First we will give you the chance to select one or more files or directories to' +
      'run the runner against.\n' +
      ' If you select only one file, then you must use the --runner option to tell Suman to use the runner, ' +
      'instead of just a single process.') + '\n\n\n' +
    ' This utility will make sure you do it right, don\'t worry.' + '\n\n' +
    colors.green(' Please confirm.') + ' (To skip this message, use the --fast option).'
  };

  const _makePromise = makePromise.bind(null, rootDir, onBackspace);

  return startGenerateCommand(opts, onBackspace).then(function (answers) {

    if (answers.confirm) {
      return run({
        rootDir: rootDir
      }, _makePromise);
    }
    else {
      console.log(' Well, we are done here then. Please start over.');
    }

  }).catch(rejectionHandler);

};