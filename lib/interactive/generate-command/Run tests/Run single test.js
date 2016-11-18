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
  chooseDirs,
  getOptions
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

    assert(obj.pathsToRun.length > 0, ' Need to select at least one path.');
    const selectedOpts = obj[ 'command-line-options' ];
    const pathsToRun = obj.pathsToRun;
    const $exec = iu.mapSumanExec(obj.exec, obj.localOrGlobal);
    iu.allDoneHere([ '$', $exec, pathsToRun, selectedOpts ]);

  }).catch(rejectionHandler);

}

function zoom (obj, cb) {

  const _zoom = zoom.bind(null, obj, cb);
  assert('executable' in obj, ' => Suman interactive implementation error.');

  if (obj.executable === 'suman') {
    return localOrGlobal(obj, cb).then(function (obj) {
      _interactiveDebug('33333333', obj);
      return run(obj, _zoom);
    });
  }
  else {
    _interactiveDebug('22222222222', obj);
    obj.localOrGlobal = null;
    return run(obj, cb);
  }

}

module.exports = function makePromise (opts, cb) {

  opts.msg = 'Would you like to run your test with the Node or Suman executable? \n' +
    '(The result is basically the same, but there are' +
    'some nuances, especially when it comes to debugging.)';

  const _makePromise = makePromise.bind(null, opts, cb);

  return nodeOrSuman(opts, cb).then(function (obj) {

    return zoom(obj, _makePromise);

  }).catch(rejectionHandler);

};