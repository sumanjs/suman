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

/////////////////////////////////////////////////////////////

const sumanOptions = require('../../parse-cmd-line-opts/suman-options');

const opts = [
  'verbose',
  'sparse',
  'match-any',
  'match-none',
  'match-all'
];

const availableOptionsForPlainNode = sumanOptions.filter(function (item) {

  const n = item.name || item.names[ 0 ];
  return opts.indexOf(n) > -1;

}).map(function (item) {

  const n = item.name || item.names[ 0 ];
  return {
    name: '--' + n + ', [type = ' + item.type + '], (' + item.help + ')',
    checked: true
  }

});

////////////////////////////////////////////////////////////

function runWithNode (rootDir) {

  chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: true

  }, function (err, dirs) {

    assert(dirs.length === 1, ' Need to select at least one path.');

    // const mapped = sumanUtils.removeSharedRootPath([dirs[ 0 ], global.projectRoot]);

    const fileToRun = sumanUtils.removePath(dirs[ 0 ], global.projectRoot);

    console.log(util.inspect(fileToRun));

    inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Select any command line options (use spacebar)',
        name: 'command-line-options',
        choices: availableOptionsForPlainNode,
        when: function () {
          console.log('\n\n --------------------------------- \n\n');
          return true;
        },

        filter: function (vals) {
          return vals.map(function (a) {
            return String(a).split(',')[ 0 ];
          });
        },
        // validate: function (answer) {
        //   console.log('\n\n aaaaa => ', answer,'\n\n\n\n');
        //   if (answer.length < 1) {
        //     return 'You must choose at least one topping.';
        //   }
        //   return true;
        // }
      }
    ]).then(function (answers) {

      debug('\n\n\n', 'answers => ', util.inspect(answers), '\n\n\n');

      const selectedOpts = answers[ 'command-line-options' ];
      console.log(' => All done here! The valid Suman command to run is => \n');
      console.log(' => ', colors.magenta.bold('node ' + fileToRun + ' ' + selectedOpts.join(' ')));

      console.log('\n\n');

    }).catch(rejectionHandler);

  });

}

function runWithSuman (rootDir) {

  chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: true

  }, function (err, dirs) {

    assert(dirs.length, ' Need to select at least one path.');

    console.log('DIRS => ', dirs);

  });

}

module.exports = function makePromise (rootDir) {

  return inquirer.prompt([
    {

      type: 'list',
      name: 'executable',
      message: 'Would you like to run your test with the Node or Suman executable? \n' +
      '(The result is basically the same, but there are' +
      'some nuances, especially when it comes to debugging.)',
      when: function () {
        return true;
      },
      choices: [
        'node your-test.js',
        'suman your-test.js'
      ],
      filter: function (val) {
        return val.toLowerCase();
      }
    },

  ]).then(function (answers) {

    if (answers.executable === 'node your-test.js') {
      return runWithNode(rootDir);
    }
    else if (answers.executable === 'suman your-test.js') {
      return runWithSuman(rootDir);
    }
    else {
      throw new Error(' => Suman implementation error, please report, no valid option selected.');
    }

  }).catch(rejectionHandler);

};