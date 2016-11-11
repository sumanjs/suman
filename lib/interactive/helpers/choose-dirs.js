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

///////////////////////////////////////////////////////////


module.exports = function chooseDirs (opts) {

  const onlyOneFile = opts.onlyOneFile;
  const originalRootDir = opts.originalRootDir;
  var output = [];

  return (function ask (rootDir) {

    return inquirer.prompt([

      {
        type: 'directory',
        name: 'filePath',
        message: 'Please select a test file that you would like to run.',
        includeFiles: true,
        basePath: rootDir,
        filterItems: function () {
          return true;
        },
        validate: function (p) {
          if (fs.statSync(p).isFile()) {
            return true;
          }
          return 'Please select a file not a directory.';
        },
        when: function () {
          if (onlyOneFile === true) {
            console.log('\n\n ----------------------------------------------- \n\n');
            return true;
          }

        }
      },
      {
        type: 'directory',
        name: 'dirOrFilePath',
        message: 'Please select a test file or directory that you would like to run.\n',
        includeFiles: true,
        basePath: rootDir,
        when: function () {
          if (onlyOneFile !== true) {
            console.log('\n\n ----------------------------------------------- \n\n');
            return true;
          }
        },
        filterItems: function () {
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'askAgain',
        message: 'Would you like to choose another file or directory (enter = yes) ?\n',
        when: function () {
          if (onlyOneFile !== true) {
            console.log('\n\n ----------------------------------------------- \n\n');
            return true;
          }
        },
        default: true
      }
    ]).then(function (answers) {

      if (answers.dirOrFilePath) {
        output.push(answers.dirOrFilePath);
      }
      else if (answers.filePath) {
        output.push(answers.filePath);
      }
      else {
        throw new Error(' No option selected.');
      }

      if (answers.askAgain) {

        return ask(rootDir);

      } else {

        output = output.map(function (item) {
          return path.isAbsolute(item) ? item : path.resolve(originalRootDir + '/' + item);
        });

        return inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmOutput',
            message: 'Are these the files/directories you wish to use? (To skip use the --fast option)\n\n' +
            colors.magenta(output.map((i, index) => ( (index + 1) + '  =>  "' + i + '"')).join(',\n')) + '\n',
            when: function () {
              console.log('\n\n ----------------------------------------------- \n\n');
              return true;
            },
            default: true
          }
        ]).then(function (respuestas) {

          if (respuestas.confirmOutput) {
            return output;
          }
          else {
            output.pop();
            return ask(rootDir);
          }

        });

      }

    }).catch(rejectionHandler);

  })(originalRootDir);

};