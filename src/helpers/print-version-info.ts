'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import chalk from 'chalk';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
require('./add-suman-global-properties');

const ascii = require('./ascii');

////////////////////////////////////////////////

// this file should only run once by design

///////////////////////////////////////////////

const cwd = process.cwd();
const pkgJSON = require('../../package.json');
const v = pkgJSON.version;
_suman.log.info('Node.js version =>', process.version);
_suman.log.info(chalk.gray.italic(`Suman v${v} running individual test suite...`));
_suman.log.info('NODE_ENV =>', `"${process.env.NODE_ENV}"`);
_suman.log.info('cwd: ' + cwd);
console.log(ascii.suman_slant, '\n');
