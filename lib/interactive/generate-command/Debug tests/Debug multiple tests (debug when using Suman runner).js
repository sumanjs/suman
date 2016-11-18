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
      //{ exec: exec }
      return debugSingle(opts, cb);
    }
  },
  function (cb) {
    return function (obj) {

      _interactiveDebug('answers in Debug single test =>', obj);

      return chooseDirs(obj, cb).then(function (answers) {

        obj.debugCmd || _implementationError(obj);
        return answers;
      });

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
  $opts.rootDir = opts.rootDir || _implementationError(opts);
  $opts.exec = opts.exec || _implementationError(opts);
  $opts.localOrGlobal = (opts.localOrGlobal !== undefined) ?
    opts.localOrGlobal : _implementationError(opts);
  $opts.optionsToUse = $opts.exec === 'suman' ? availableOptionsForPlainNode : availableOptionsForSuman;

  return promiseReducer(run, $opts, cb, fns, completeFns).then(function (obj) {

    _interactiveDebug('FINAL OBJ in debug multiple tests => ', obj);
    assert(obj.pathsToRun.length > 0, ' Need to select at least one path.');
    const selectedOpts = obj['command-line-options'];
    const pathsToRun = obj.pathsToRun;
    const ex = iu.mapSumanExec(obj.debugCmd, localOrGlobal);

    iu.allDoneHere([ '$', ex, pathsToRun, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir, onBackspace) {

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');


  const _makePromise = makePromise.bind(null, rootDir, onBackspace);

  const fn = localOrGlobal.bind(null, null, _makePromise);

  return fn().then(function (answers) {

    _interactiveDebug('3', answers);
    return run({
      rootDir: rootDir,
      exec: 'suman',
      localOrGlobal: answers.localOrGlobal
    }, _makePromise);

  }).catch(rejectionHandler);

};