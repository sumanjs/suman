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

//////////////////////////////////////////////////////////////


module.exports = function nodeOrSuman(opts){

  const msg = opts.msg;

  return inquirer.prompt([
    {
      type: 'list',
      name: 'executable',
      message: msg || _implementationError('no message passed to fn'),
      when: function () {
        console.log('\n\n -------------------------------------------- \n\n');
        return true;
      },
      choices: choices.nodeOrSuman,
      filter: function (val) {
        return val;
      }
    },

  ])
};