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


module.exports = function start(opts, backspaceCB){

  const msg = opts.msg;

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      onLeftKey: function(){
        process.nextTick(backspaceCB);
      },
      message: msg,
      when: function () {
        console.log(' ------------------------------------------------------- ');
        return true;
      }
    },

  ]);
};