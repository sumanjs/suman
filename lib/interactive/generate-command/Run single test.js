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

function run (rootDir, answers) {

  const useNode = answers.nodeOrSuman === choices.nodeOrSuman.node;
  const optionsToUse = useNode? availableOptionsForPlainNode : availableOptionsForSuman;

  return chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: true,

  }).then(function (dirs) {

    assert(dirs.length > 0, ' Need to select at least one path.');
    const fileToRun = sumanUtils.removePath(dirs[ 0 ], global.projectRoot);
    console.log(util.inspect(fileToRun));

    return getOptions(optionsToUse).then(function (answers) {

      const selectedOpts = answers[ 'command-line-options' ];
      console.log(' => All done here! The valid Suman command to run is => \n');
      console.log(' => ', colors.magenta.bold('node ' + fileToRun + ' ' + selectedOpts.join(' ')));

      console.log('\n\n');

    }).catch(rejectionHandler);

  });

}

module.exports = function makePromise (rootDir) {

  return nodeOrSuman().then(function (answers) {
    return run(rootDir, answers);

  }).catch(rejectionHandler);

};