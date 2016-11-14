'use striiiict';

//core
const assert = require('assert');
const util = require('util');

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
const iu = require('../helpers/interactive-utils');

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

function run (opts) {

  const rootDir = opts.rootDir;
  const localOrGlobal = opts.localOrGlobal;
  const exec = opts.exec;
  const optionsToUse = exec === 'suman' ? availableOptionsForPlainNode : availableOptionsForSuman;

  return chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: true,

  }).then(function (file) {

    assert(file.length > 0, ' Need to select at least one path.');

    return getOptions(optionsToUse).then(function (answers) {
      return {
        options: answers[ 'command-line-options' ],
        file: file
      }
    });

  }).then(function (answers) {

    const selectedOpts = answers.options;
    const file = answers.file;
    const $exec = iu.mapSumanExec(exec, localOrGlobal);
    iu.allDoneHere([ '$', $exec, file, selectedOpts ]);

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  const opts = {
    msg: 'Would you like to run your test with the Node or Suman executable? \n' +
    '(The result is basically the same, but there are' +
    'some nuances, especially when it comes to debugging.)'
  };

  return nodeOrSuman(opts).then(function (answers) {

    assert('executable' in answers, ' => Suman interactive implementation error.');

    const exec = answers.executable;

    _interactiveDebug('1', answers);

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