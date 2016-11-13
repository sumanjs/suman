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

function run (rootDir, opts) {

  const exec = opts.exec;
  const localOrGlobal = opts.localOrGlobal;
  const optionsToUse = exec === 'suman' ? availableOptionsForPlainNode : availableOptionsForSuman;

  var file, debugCmd;

  return debugSingle({ exec: exec }).then(function (answers) {

    _interactiveDebug('answers in Debug single test =>', answers);

    debugCmd = answers.debug;

    return chooseDirs({
      originalRootDir: rootDir,
      onlyOneFile: true,
    });

  }).then(function (f) {

    assert(f.length > 0, ' Need to select at least one path.');
    file = f;

    return getOptions(optionsToUse);

  }).then(function (answers) {

    const selectedOpts = answers[ 'command-line-options' ];
    console.log(' => All done here! The valid Suman command to run is => \n');

    var ex = debugCmd;

    if(exec === 'suman'){
      if(localOrGlobal === 'local'){
        ex = './node_modules/.bin/' + ex;
      }
    }

    console.log(' => ', colors.magenta.bold([ '$', ex, file, selectedOpts ].join(' ')));

    console.log('\n\n');

  }).catch(rejectionHandler);

}

module.exports = function makePromise (rootDir) {

  const opts = {
    msg: 'Would you like to debug your test with the Node or Suman executable?\n' +
    '(Suman makes it easy to use either).'
  };

  return nodeOrSuman(opts).then(function (answers) {

    assert('executable' in answers, ' => Suman interactive implementation error.');

    _interactiveDebug('1', answers);

    const exec = answers.executable;

    if (exec === 'suman') {

      return localOrGlobal().then(function (answers) {

        _interactiveDebug('3', answers);

        return run(rootDir, {
          exec: exec,
          localOrGlobal: answers.localOrGlobal
        });
      });
    }
    else {
      _interactiveDebug('2', answers);

      return run(rootDir, {
        exec: exec,
        localOrGlobal: null
      });
    }

  }).catch(rejectionHandler);

};