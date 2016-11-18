'use striiiict';

//core
const assert = require('assert');
const util = require('util');

//npm
const inquirer = require('inquirer');
const colors = require('colors/safe');

//project
const debug = require('debug')('suman:interactive');
const chooseDirs = require('../../helpers/choose-dirs');
const sumanUtils = require('suman-utils/utils');
const rejectionHandler = require('../../interactive-rejection-handler');
const choices = require('../../helpers/choices');
const nodeOrSuman = require('../../helpers/node-or-suman');
const getOptions = require('../../helpers/available-options');
const filteredOptions = require('../../helpers/return-filtered-opts');
const localOrGlobal = require('../../helpers/local-or-global-suman');
const debugSingle = require('../../helpers/debug-single');
const iu = require('../../helpers/interactive-utils');
const promiseReducer = require('../../helpers/promise-reducer');

/////////////////////////////////////////////////////////////

const opts = [
  'verbose',
  'sparse',
  'match-any',
  'match-none',
  'match-all'
];

const availableOptionsForPlainNode = filteredOptions(opts);
const availableOptionsForSuman = filteredOptions(opts);

////////////////////////////////////////////////////////////

const completeFns = [];
const fns = [

  function (cb) {
    return function (opts) {
      return debugSingle(opts, cb);
    }
  },

  function (cb) {
    return function (opts) {
      _interactiveDebug('answers in Debug single test =>', opts);
      return chooseDirs(opts, cb);
    }
  },

  function (cb) {
    return function (obj) {
      return getOptions(obj, cb);
    }
  }

];

function run (opts, cb) {

  const $opts = {};
  $opts.onlyOneFile = true;
  $opts.rootDir = opts.rootDir || _implementationError(opts);
  $opts.exec = opts.exec || _implementationError(opts);
  $opts.localOrGlobal = opts.localOrGlobal || _implementationError(opts);
  $opts.optionsToUse = (opts.exec === 'suman') ? availableOptionsForPlainNode : availableOptionsForSuman;

.
  promiseReducer(run, opts, cb, fns, completeFns).then(function (obj) {

    assert(obj.pathsToRun.length > 0, ' Need to select at least one path.');
    const selectedOpts = obj['command-line-options'];
    const file = obj.file;
    const ex = iu.mapSumanExec(obj.debugCmd, localOrGlobal);
    iu.allDoneHere([ '$', ex, file, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');

  const opts = {
    msg: 'Would you like to debug your test with the Node or Suman executable?' +
    ' (Suman makes it easy to use either).\n\n'
  };

  return nodeOrSuman(opts, makePromise).then(function (answers) {

    assert('executable' in answers, ' => Suman interactive implementation error.');

    _interactiveDebug('1', answers);

    const exec = answers.executable;

    if (exec === 'suman') {

      return localOrGlobal().then(function (answers) {

        _interactiveDebug('3', answers);
        return run({
          rootDir: rootDir,
          exec: exec,
          localOrGlobal: answers.localOrGlobal
        });
      });
    }
    else {
      _interactiveDebug('2', answers);
      return run({
        rootDir: rootDir,
        exec: exec,
        localOrGlobal: null
      });
    }

  }).catch(rejectionHandler);

};