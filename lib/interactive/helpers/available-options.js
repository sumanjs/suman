'use striiict';

//core
const assert = require('assert');
const util = require('util');
const path = require('path');
const fs = require('fs');

//npm
const colors = require('colors/safe');
const inquirer = require('inquirer');

//project
const rejectionHandler = require('../interactive-rejection-handler');

/////////////////////////////////////////////////////////////////////

module.exports = function getAvailableOptions (availableOptions, backspaceCB) {

  return inquirer.prompt([
    {
      type: 'checkbox',
      message: 'Select any command line options (use spacebar)',
      name: 'command-line-options',
      choices: availableOptions,
      when: function () {
        console.log('\n\n ---------------------------------------- \n\n');
        return true;
      },
      onLeftKey: function(){
        process.nextTick(backspaceCB);
      },

      filter: function (vals) {
        return vals.map(function (a) {
          return a;
          // return String(a).split(',')[ 0 ];
        }).join(' ');
      },

      // validate: function (answer) {
      //   console.log('\n\n aaaaa => ', answer,'\n\n\n\n');
      //   if (answer.length < 1) {
      //     return 'You must choose at least one topping.';
      //   }
      //   return true;
      // }
    }
  ])
};