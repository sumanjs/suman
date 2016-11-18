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
  debugSingle,
  chooseDirs,
  getOptions
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
    const selectedOpts = obj[ 'command-line-options' ];
    const file = obj.file;
    const ex = iu.mapSumanExec(obj.debugCmd, localOrGlobal);
    iu.allDoneHere([ '$', ex, file, selectedOpts ]);

  }).catch(rejectionHandler);

}

function zoom (opts, cb) {

  const _zoom = zoom.bind(null, opts, cb);

  return nodeOrSuman(opts, cb).then(function (obj) {

    assert('executable' in obj, ' => Suman interactive implementation error.');
    _interactiveDebug('1', obj);

    if (obj.executable === 'suman') {
      return localOrGlobal(obj, _makePromise).then(function (obj) {
        return run(obj, _zoom);
      });
    }
    else {
      _interactiveDebug('2', obj);
      obj.localOrGlobal = null;
      return run(obj, _zoom);
    }

  }).catch(rejectionHandler);
}

module.exports = function makePromise (opts, cb) {

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');

  opts.msg = 'Would you like to debug your test with the Node or Suman executable?' +
    ' (Suman makes it easy to use either).\n\n';

  const _makePromise = makePromise.bind(null, opts, cb);
  return zoom(opts, _makePromise);

};