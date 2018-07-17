'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";
import {AsyncQueue} from 'async';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import EE = require('events');

//npm
import async = require('async');
import chalk from 'chalk';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const suiteResultEmitter = _suman.suiteResultEmitter = (_suman.suiteResultEmitter || new EE());
import {shutdownProcess, handleSingleFileShutdown} from "./helpers/handle-suman-shutdown";

//////////////////////////////////////////////////////////////////////////

export const run = function (testRegistrationQueue: AsyncQueue<Function>, testQueue: AsyncQueue<Function>) {

  testQueue.drain = function(){
    if(testRegistrationQueue.idle()){
      _suman.log.verygood('we are done with all tests in the browser.');
      shutdownProcess();
    }
  };

  _suman.log.good('resuming test registration in the browser.');
  testRegistrationQueue.resume();


};


