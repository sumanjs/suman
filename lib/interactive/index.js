//core
const assert = require('assert');
const util = require('util');
const fs = require('fs');
const path = require('path');

//npm
const debug = require('debug')('suman:interactive');
const inquirer = require('inquirer');
const inqDir = require('inquirer-directory');
const colors = require('colors/safe');

//project
const rejectionHandler = require('./interactive-rejection-handler');

//////////////////////////////////////////////////////

inquirer.registerPrompt('directory', inqDir);

const testDir = global.sumanConfig.testDir;

var rootDir;

try {
  rootDir = path.resolve(global.projectRoot + '/' + testDir);
  if (!(fs.statSync(rootDir).isDirectory())) {
    throw new Error('Path given by => "' + rootDir + '" is not a directory');
  }
}
catch (err) {
  rootDir = global.projectRoot;
}

//TODO: we can validate that all the choices are actually files in a directory

const optz = {
  'Generate a valid Suman terminal command': ' (1) Generate a valid Suman terminal command',
  'Troubleshoot/debug test(s)': ' (2) Troubleshoot/debug test(s)',
  'Learn the Suman API': ' (3) Learn the Suman API'
};

const firstSetOfQuestions = [
  {

    type: 'confirm',
    name: 'suman',
    message: colors.yellow(' => Welcome to Suman land!') + '\n' +
    colors.blue('  This interactive utility allows you to familiarize yourself with Suman, as well as keep up to date with the API.\n' +
      '  You can generate a terminal command with this tool which you can then go run yourself.\n' +
      '  This tool can also help you troubleshoot or debug tests.') + '\n' +
    ' \n  To skip this messsage the future, just use ' + colors.blue('"suman --interactive --fast"') + '.\n\n' +
    '  To ' + colors.green('continue') + ', hit enter, or type "y" or "yes".\n\n ',
    when: function () {
      if (process.argv.indexOf('--fast') < 0) {
        console.log('\n\n ---------------------------------------------------- \n\n');
        return true;
      }
    }
  },

  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    default: 'Generate a valid Suman terminal command',
    choices: Object.values(optz), //add empty option for formatting purposes
    when: function (d) {
      if (d.suman === false) {
        console.log('\n\n');
        console.log('\n => Confirmation was false...ok, we will exit then!');
        process.exit(1);
      }
      else {
        console.log('\n\n ---------------------------------------------------- \n\n');
        return true;
      }
    }
  }
];

const secondSetOfQuestions = [
  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    default: 'Run single test',
    choices: [
      'Run single test',
      'Run multiple tests',
      'Run tests with test coverage (Istanbul)',
      'Transpile test(s)',
      'Transpile test(s) + run them',
      'Watch for file changes (and run tests on changes)',
      'Watch for file changes (and transpile tests on changes)',
      'Watch for file changes (and transpile + run tests on changes)',
      'Debug single test',
      'Debug multiple tests (need to debug when using Suman runner)'
    ],
    when: function () {
      console.log('\n\n ----------------------------------------------------- \n\n');
      return true;
    }
  }
];

inquirer.prompt(firstSetOfQuestions).then(function (respuestas) {
  if (respuestas.action === optz['Generate a valid Suman terminal command']) {
    return inquirer.prompt(secondSetOfQuestions).then(function (answers) {
      return require('./generate-command/' + answers.action + '.js')(rootDir);
    });
  }
  else if (respuestas.action === 'Learn the Suman API') {
    throw new Error('Learn the Suman API is not implemented yet.');
  }
  else {
    throw new Error('Action not recognized.');
  }

}).catch(rejectionHandler);