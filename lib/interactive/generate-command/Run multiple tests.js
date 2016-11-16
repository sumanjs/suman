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

const availableOptionsSumanRunner = filteredOptions(opts);

_interactiveDebug('multiple tests (Suman runner) available opts => ', util.inspect(availableOptionsSumanRunner));

////////////////////////////////////////////////////////////

const fns = [

  function (cb) {

    return function (obj) {
      const rootDir = obj.rootDir;
      return chooseDirs({
        originalRootDir: rootDir,
        onlyOneFile: false
      }, cb).then(function (pathsToRun) {
        return {
          rootDir: rootDir,
          pathsToRun: pathsToRun
        }
      })

    }

  },
  function (cb) {

    return function (obj) {
      const pathsToRun = obj.pathsToRun;
      assert(pathsToRun.length > 0, ' You need to select at least one path.');
      return getOptions(availableOptionsSumanRunner, cb).then(function (answers) {
        return {
          options: answers[ 'command-line-options' ],
          pathsToRun: pathsToRun
        }
      });

    }
  },

  function (cb) {
    return function (answers) {
      return localOrGlobal({}, cb).then(function (a) {
        return Object.assign(answers, {
          localOrGlobal: a.localOrGlobal
        })
      });

    }
  }

];

var firstFn = null;
const completeFns = [];


function run (opts, cb) {

  var runCB = run.bind(null, opts, cb);

  const seed = firstFn ? firstFn(opts) : Promise.resolve(opts);

  _interactiveDebug('seed', util.inspect(seed));

  fns.reduce(function (prev, curr) {

    _interactiveDebug('prev', util.inspect(prev));

    return prev.then(function (obj) {
      runCB = run.bind(null, obj, run);
      completeFns.push(fns.pop());
      firstFn = function(obj){
          return Promise.resolve(obj);
      };
      return curr(runCB)(obj);
    });
  }, seed).then(function (answers) {

    const sumanExec = iu.mapSumanExec('suman', answers.localOrGlobal);
    const pathsToRun = answers.pathsToRun;
    const selectedOpts = answers.options;
    iu.allDoneHere([ '$', sumanExec, pathsToRun, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir, backspaceCB) {

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

  const newOnBackspace = makePromise.bind(null, rootDir, backspaceCB);

  return startGenerateCommand(opts, backspaceCB).then(function (answers) {

    if (answers.confirm) {
      return run({
        rootDir: rootDir
      }, newOnBackspace);
    }
    else {
      console.log(' Well, we are done here then. Please start over.');
    }

  }).catch(rejectionHandler);

};