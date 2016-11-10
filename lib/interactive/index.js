
//core
const assert = require('assert');
const util = require('util');

//npm
const debug = require('debug')('suman:interactive');
const inquirer = require('inquirer');
const inqDir = require('inquirer-directory');
const colors = require('colors/safe');

//project



//////////////////////////////////////////////////////

inquirer.registerPrompt('directory', inqDir);


//TODO: we can validate that all the choices are actually files in a directory

const firstSetOfQuestions = [
  {

    type: 'confirm',
    name: 'suman',
    message: 'Welcome to Suman land! This utility will allow you to generate a terminal command which you then can go run yourself. Got it ? :) \n To skip this messsage ' +
    'the future, just use suman --interactive --fast. (You can also choose to learn about the Suman API instead of generating a command).',
    when: function () {
      console.log('\n ---------------------------------------------------- \n');
      return (process.argv.indexOf('--fast') < 0);
    }
  },

  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    default: 'Generate a valid Suman terminal command',
    choices: [
      'Generate a valid Suman terminal command',
      'Learn the Suman API'
    ],
    when: function (d) {
      console.log('\n ---------------------------------------------------- \n');
      if (d.suman === false) {
        console.log('\n => Confirmation was false...ok, we will exit then!');
        process.exit(1);
      }
      else {
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
      'Watch for file changes (and transpile + run tests on changes)'
    ],
    when: function(){
      console.log('\n\n');
      return true;
    }

  }
];


inquirer.prompt(firstSetOfQuestions).then(function (respuestas) {

  debug('Respuestas => ', respuestas);

  if (respuestas.action === 'Generate a valid Suman terminal command') {
    return inquirer.prompt(secondSetOfQuestions).then(function (answers) {
      return require('./generate-command/' + answers.action + '.js')();
    });
  }
  else if(respuestas.action === 'Learn the Suman API'){
    throw new Error('Learn the Suman API is not implemented yet.');
  }
  else{
    throw new Error('Action not recognized.');
  }

}).catch(function (err) {

  console.error(
    '\n\n',
    colors.bgRed.white.bold(' => Suman implemenation error => Error captured by catch block =>'),
    '\n',
    colors.red(err.stack || err),
    '\n\n'
  );

});