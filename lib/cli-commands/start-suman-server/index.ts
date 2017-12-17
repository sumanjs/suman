'use strict';
import {IPseudoError, ISumanConfig} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const os = require('os');
import util = require('util');

//project
const _suman = global.__suman = (global.__suman || {});
const sumanServer = require('./create-suman-server');

//////////////////////////////////////////////////////////////////////////////////////////////////

export const run = function (sumanServerInstalled: boolean, sumanConfig: ISumanConfig, serverName: string) {
  
  if (!sumanServerInstalled) {
    throw new Error(' => Suman server is not installed yet => Please use "$ suman --use-server" in your local project.');
  }
  
  sumanServer({
      //configPath: 'suman.conf.js',
      config: sumanConfig,
      serverName: serverName || os.hostname()
    },
    
    function (err: IPseudoError, val: any) {
      
      if (err) {
        console.error(err.stack || err);
        process.nextTick(function () {
          process.exit(1);
        });
      }
      else {
        console.log('Suman server should be live at =>', util.inspect(val));
        process.nextTick(function () {
          process.exit(0);
        });
        
      }
      
    });
  
};
