'use striiiict';

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
inquirer.registerPrompt('directory', inqDir);
const rejectionHandler = require('./interactive-rejection-handler');
const choices = require('./helpers/choices');

//////////////////////////////////////////////////////

process.on('warning', function (w) {
  console.log(' => Suman interactive warning => ', w.stack || w);
});

//////////////////////////////////////////////////////

process.stdin.setMaxListeners(10);

///////////////////////////////////////////////////////

const interactiveDebugStream =
  fs.createWriteStream(path.resolve(__dirname + '/helpers/debug-interactive.log'));

global._interactiveDebug = function () {
  interactiveDebugStream.write('\n\n');
  const args = Array.prototype.slice.call(arguments);
  const data = args.map(function (a) {
    return (typeof a === 'string' ? a : util.inspect(a));
  }).join('\n');

  interactiveDebugStream.write.apply(interactiveDebugStream, [ data ]);
};

global._implementationError = function (msg) {
  msg = msg || '';
  msg = typeof msg === 'string' ? msg : util.inspect(msg);
  throw new Error(colors.red(' => Suman interactive internal implementation problem ' + (msg || '.')));
};

_interactiveDebug(' => beginning of interactive session => ');

//////////////////////////////////////////////////////

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

var firstQuestionSeen = false;

const firstSetOfQuestions = [
  {

    type: 'confirm',
    name: 'suman',
    message: colors.yellow.underline(' => Welcome to Suman land!') + '\n' +
    colors.blue('  This interactive utility allows you to familiarize yourself with Suman, as well as keep up to date with the API.\n' +
      '  You can generate a terminal command with this tool which you can then go run yourself.\n' +
      '  This tool can also help you troubleshoot or debug tests.') + '\n' +
    ' \n  To skip this messsage the future, just use ' + colors.magenta('"suman --interactive --fast"') + '.\n\n' +
    '  To ' + colors.green('continue') + ', hit enter, or type "y" or "yes".\n\n ',
    when: function () {
      if (!firstQuestionSeen) {
        firstQuestionSeen = true;
        if (process.argv.indexOf('--fast') < 0) {
          console.log('\n\n ---------------------------------------------------- \n\n');
          return true;
        }
      }

    }
  },

  {
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    default: 0,
    onLeftKey: function () {
      _interactiveDebug('left key fired in top level!');
      process.nextTick(function () {
        start();
      });
    },
    choices: Object.values(choices.topLevelOpts), //add empty option for formatting purposes
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
    onLeftKey: function () {
      _interactiveDebug('left key fired in generate list!');
      // this.screen.done();
      process.nextTick(function () {
        start();
      });

    },
    default: 'Run single test',
    choices: fs.readdirSync(path.resolve(__dirname + '/generate-command')).map(function (item) {
      return String(item).slice(0, -3);  // get rid of ".js"
    }),
    when: function () {
      console.log('\n\n ----------------------------------------------------- \n\n');
      return true;
    }
  }
];

function secondSet () {
  return inquirer.prompt(secondSetOfQuestions).then(function (answers) {
    return require('./generate-command/' + answers.action + '.js')(rootDir);
  });
}

function start () {

  // inquirer.restoreDefaultPrompts();

  // inquirer.prompt.removeAllListeners();

  process.stdin.removeAllListeners('keypress');
  process.stdin.removeAllListeners('end');

  _interactiveDebug('readable count:', process.stdin.listenerCount('readable'));

  _interactiveDebug('keypress count:', process.stdin.listenerCount('keypress'));

  // while (process.stdin.listenerCount('readable') > 1) {
  //   _interactiveDebug('removing readable listener');
  //   process.stdin.removeListener('readable');
  // }

  _interactiveDebug('removing keypress listener');
  _interactiveDebug('keypress count:', process.stdin.listenerCount('keypress'));

  // while (process.stdin.listenerCount('keypress') > 1) {
  //   _interactiveDebug('removing keypress listener');
  //   _interactiveDebug('keypress count:', process.stdin.listenerCount('keypress'));
  //   process.stdin.removeListener('keypress');
  // }

  inquirer.restoreDefaultPrompts();

  inquirer.prompt(firstSetOfQuestions).then(function (respuestas) {
    if (respuestas.action === choices.topLevelOpts.GenerateCommand) {
      return secondSet();
    }
    else if (respuestas.action === choices.topLevelOpts.Learn) {
      throw new Error('Learn the Suman API is not implemented yet.');
    }
    else if (respuestas.action === choices.topLevelOpts.Troubleshoot) {
      throw new Error('Troubleshoot is not implemented yet.');
    }
    else {
      throw new Error('Action not recognized.');
    }

  }).catch(rejectionHandler);

}

start();
