'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');


//core
const cp = require('child_process');
const os = require('os');

//npm
import * as chalk from 'chalk';

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../../config/suman-constants');
const su = require('suman-utils');

/////////////////////////////////////////////////////////////////////////////////////////////

let logged = true;

module.exports = {

  logPermissonsAdvice: function logPermissonsAdvice () {
    if (logged) {
      logged = false;
      console.log('\n\n' + chalk.magenta(' => You may wish to run the "$ suman --init" commmand with root permissions.'));
      console.log(chalk.magenta(' => If using sudo to run arbitrary/unknown commands makes you unhappy, then please use chown as following:'));
      console.log(chalk.bgBlack.cyan('  # chown -R $(whoami) $(npm root -g) $(npm root) ~/.npm  ') + '\n\n');
    }
  }

};
