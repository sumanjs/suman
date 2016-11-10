'use striiiict';

//core

//npm
const inquirer = require('inquirer');


module.exports = function makePromise(){


  return inquirer.prompt([

    {

      type: 'confirm',
      name: 'suman',
      message: 'jjjjjjjjjjjj',
      when: function () {
        return true;
      }
    },

  ]).then(function(answers){

    console.log(' answers in Istanbul test => ', answers);

  });




};