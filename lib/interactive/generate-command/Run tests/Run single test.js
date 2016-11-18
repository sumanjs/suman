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
    return function (obj) {
      return chooseDirs(obj, cb);
    }
  },
  function (cb) {
    return function (obj) {
      return getOptions(obj, cb);
    }
  }
];

///////////////////////////////////////////////////////////

function run (opts, cb) {

  const $opts = {};
  $opts.rootDir = opts.rootDir;
  $opts.localOrGlobal = opts.localOrGlobal;
  $opts.exec = opts.exec;
  $opts.onlyOneFile = true;
  $opts.optionsToUse = (opts.exec === 'suman') ? availableOptionsForPlainNode : availableOptionsForSuman;

  promiseReducer(run, $opts, cb, fns, completeFns).then(function (obj) {

    assert(obj.pathsToUse.length > 0, ' Need to select at least one path.');
    const selectedOpts = obj['command-line-options'];
    const pathsToUse = obj.pathsToUse;
    const $exec = iu.mapSumanExec(exec, localOrGlobal);
    iu.allDoneHere([ '$', $exec, pathsToUse, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir, backspaceCB) {

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');

  const opts = {
    msg: 'Would you like to run your test with the Node or Suman executable? \n' +
    '(The result is basically the same, but there are' +
    'some nuances, especially when it comes to debugging.)'
  };

  return nodeOrSuman(opts, backspaceCB).then(function (answers) {

    assert('executable' in answers, ' => Suman interactive implementation error.');

    const exec = answers.executable;

    const onBackspace = makePromise.bind(null, rootDir, backspaceCB);

    _interactiveDebug('1', answers);

    if (exec === 'suman') {
      return localOrGlobal(null, onBackspace).then(function (answers) {
        _interactiveDebug('3', answers);
        return run({
          rootDir: rootDir,
          exec: exec,
          localOrGlobal: answers.localOrGlobal
        }, onBackspace);
      });
    }
    else {
      _interactiveDebug('2', answers);
      return run({
        rootDir: rootDir,
        exec: exec,
        localOrGlobal: null
      }, onBackspace);
    }

  }).catch(rejectionHandler);

};