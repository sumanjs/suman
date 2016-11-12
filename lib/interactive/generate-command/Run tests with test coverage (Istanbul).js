'use striiiict';

//core
const assert = require('assert');
const util = require('util');
const cp = require('child_process');

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

const execs = {
  'Locally installed ($ suman foo bar baz)': './node_modules/.bin/suman',
  'Globally installed ($ ./node_modules/.bin/suman foo bar baz)': 'suman'
};

function runWithSumanRunner (rootDir) {

  return chooseDirs({

    originalRootDir: rootDir,
    onlyOneFile: false

  }).then(function (dirs) {

    assert(dirs.length > 0, ' You need to select at least one path.');

    const pathsToRun = dirs.map(function (p) {
      return sumanUtils.removePath(p, global.projectRoot);
    }).join(' ');


    return inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Select any command line options (use spacebar)',
        name: 'command-line-options',
        // choices: availableOptionsForPlainNode,
        choices: availableOptionsForPlainNode,
        when: function () {
          console.log('\n\n ---------------------------------------- \n\n');
          return true;
        }

        // filter: function (val) {
        //   console.log('\n\n\nval => ', val, '\n\n\n');
        //   return String(val).split(',')[ 0 ];
        // },
        // validate: function (answer) {
        //   console.log('\n\n aaaaa => ', answer,'\n\n\n\n');
        //   if (answer.length < 1) {
        //     return 'You must choose at least one topping.';
        //   }
        //   return true;
        // }
      }
    ]).then(function (answers) {

      const selectedOpts = answers[ 'command-line-options' ];

      return inquirer.prompt([

        {
          type: 'list',
          name: 'localOrGlobal',
          message: 'Want to use the global or locally installed Suman executable?',
          default: 'Globally installed ($ ./node_modules/.bin/suman foo bar baz)',
          choices: Object.keys(execs),
          when: function () {
            console.log('\n\n --------------------------------- \n\n');
            return true;
          },
          validate: function (item) {
            if (item === 'Globally installed ($ ./node_modules/.bin/suman foo bar baz)') {
              var z;
              if (!(z = cp.execSync('which suman'))) {
                console.log(' => Could not find a global installation of suman using "$ which suman". Perhaps ' +
                  'try local instead, or run $ npm install -g suman"...');
                return false;
              }
              else {
                console.log('Your globally installed Suman package is here => ' + colors.magenta(z));
                return true;
              }
            }
            else if (item === 'Locally installed ($ suman foo bar baz)') {

              try {
                require.resolve(global.projectRoot + '/node_modules/.bin/suman');
                return true;
              }
              catch (err) {
                return ' => It does not appear that you have a locally installed Suman package, try' +
                  '$ npm install -D suman';
              }
            }
            else {
              throw new Error('Well, this is weird.');
            }

          }
        }

      ]).then(function (val) {

        const sumanExec = execs[ val.localOrGlobal ];

        console.log('\n\n => All done here! The valid Suman command to run is => \n');

        console.log(' => ', colors.magenta.bold(' $ ' + sumanExec + ' --coverage ' + pathsToRun + ' ' + selectedOpts.map(a => {
            return String(a).split(',')[ 0 ];
          }).join(' ')));

        console.log('\n\n');

      }).catch(rejectionHandler);

    });

  });

}

module.exports = function makePromise (rootDir) {

  return inquirer.prompt([
    {

      type: 'confirm',
      name: 'confirm',
      message: colors.yellow(' => To run coverage with Suman you can run coverage on multiple tests as you would expect, ' +
        'and you can do so by running them with the runner or in separate processes without the runner.') +
      + colors.blue(' First we will give you the chance to select one or more files or directories to' +
        'run the runner against.\n' +
        ' If you select only one file, then you must use the --runner option to tell Suman to use the runner, ' +
        'instead of just a single process.') + '\n\n\n' +
      ' This utility will make sure you do it right, don\'t worry.' + '\n\n' +
      colors.green(' Please confirm.') + ' (To skip this message, use the --fast option).',
      when: function () {
        console.log(' ------------------------------------------------------- ');
        return true;
      }
    },

  ]).then(function (answers) {

    if (answers.confirm) {
      return runWithSumanRunner(rootDir);
    }
    else {
      console.log(' Well, we are done here then. Please start over.');
    }

  }).catch(rejectionHandler);

};