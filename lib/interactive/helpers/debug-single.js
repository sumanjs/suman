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

module.exports = function debugSingle (opts) {

  const exec = opts.exec;

  return inquirer.prompt([
    {
      type: 'list',
      name: 'debug',
      message: 'Which technique would you like to use to debug your tests?',
      when: function () {
        return true;
      },
      choices: exec === 'node' ? choices.nodeDebug : choices.sumanDebug,
      filter: function (val) {
        return val;
      }
    },

  ]).then(function (answers) {
    _interactiveDebug('answers in debug-single =>', answers);
     return answers;
  });

};