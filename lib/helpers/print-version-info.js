'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
require('./add-suman-global-properties');

const ascii = require('./ascii');

////////////////////////////////////////////////

// this file should only run once by design

///////////////////////////////////////////////

const cwd = process.cwd();
const pkgJSON = require('../../package.json');
const v = pkgJSON.version;
_suman.log('Node.js version =>', process.version);
_suman.log(colors.gray.italic('Suman v' + v + ' running individual test suite...'));
_suman.log('cwd: ' + cwd);
console.log(ascii.suman_slant, '\n');
