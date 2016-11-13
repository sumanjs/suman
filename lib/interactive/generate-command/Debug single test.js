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
const debugSingle = require('../helpers/debug-single');
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

  const rootDir = opts.originalRootDir || _implementationError(opts);
  const exec = opts.exec || _implementationError(opts);
  const localOrGlobal = opts.localOrGlobal || _implementationError(opts);
  const optionsToUse = exec === 'suman' ? availableOptionsForPlainNode : availableOptionsForSuman;

  return debugSingle({ exec: exec }).then(function (answers) {

    _interactiveDebug('answers in Debug single test =>', answers);

    return chooseDirs({

      originalRootDir: rootDir,
      onlyOneFile: true,

    }).then(function (file) {

      assert(file.length > 0, ' Need to select at least one path.');

      return {
        file: file,
        debugCmd: answers.debug || _implementationError(answers)
      }
    });

  }).then(function (obj) {

    return getOptions(optionsToUse).then(function (answers) {
      return Object.assign(obj, {
        options: answers[ 'command-line-options' ] || _implementationError(answers)
      });
    });

  }).then(function (obj) {

    const selectedOpts = obj.options;
    const file = obj.file;
    const ex = iu.mapSumanExec(obj.debugCmd, localOrGlobal);

    console.log('\n\n',' => All done here! The valid Suman command to run is => ');
    console.log('  => ', colors.magenta.bold([ '$', ex, file, selectedOpts ].join(' ')));
    console.log('\n\n');

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  const opts = {
    msg: 'Would you like to debug your test with the Node or Suman executable?' +
    ' (Suman makes it easy to use either).\n\n'
  };

  return nodeOrSuman(opts).then(function (answers) {

    assert('executable' in answers, ' => Suman interactive implementation error.');

    _interactiveDebug('1', answers);

    const exec = answers.executable;

    if (exec === 'suman') {

      return localOrGlobal().then(function (answers) {

        _interactiveDebug('3', answers);
        return run({
          originalRootDir: rootDir,
          exec: exec,
          localOrGlobal: answers.localOrGlobal
        });
      });
    }
    else {
      _interactiveDebug('2', answers);
      return run({
        originalRootDir: rootDir,
        exec: exec,
        localOrGlobal: null
      });
    }

  }).catch(rejectionHandler);

};