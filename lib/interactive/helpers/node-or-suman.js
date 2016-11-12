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


module.exports = function nodeOrSuman(){

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
      choices: choices.nodeOrSuman,
      filter: function (val) {
        return val;
      }
    },

  ])
};