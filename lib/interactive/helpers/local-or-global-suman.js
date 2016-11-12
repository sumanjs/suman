'use striiiict';


//core
const assert = require('assert');
const util = require('util');
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
const colors = require('colors/safe');
const inquirer = require('inquirer');

//project
const rejectionHandler = require('../interactive-rejection-handler');
const choices = require('./choices');


module.exports = function localOrGlobal(){

  return inquirer.prompt([

    {
      type: 'list',
      name: 'localOrGlobal',
      message: 'Want to use the global or locally installed Suman executable?',
      default: 0,
      choices: choices.localOrGlobalChoices,
      when: function () {
        console.log('\n\n --------------------------------- \n\n');
        return true;
      },
      validate: function (item) {
        if (item === 'Globally installed ($ ./node_modules/.bin/suman foo bar baz)') {
          var z;
          if (!(z = cp.execSync('which suman'))) {
            return ' => Could not find a global installation of suman using "$ which suman". Perhaps ' +
              'try local instead, or run $ npm install -g suman"...';
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

  ]);
};