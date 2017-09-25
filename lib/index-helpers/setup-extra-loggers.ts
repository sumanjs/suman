//typescript imports
import {IGlobalSumanObj} from "suman-types/dts/global";
import {ISumanModuleExtended} from "suman-types/dts/index-init";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import assert = require('assert');
import util = require('util');
import fs = require('fs');

//project
let inBrowser = false;
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

//env
const IS_SUMAN_DEBUG = process.env.SUMAN_DEBUG === 'yes';
const SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

/////////////////////////////////////////////////////////////////////////////////////

let callable = true;

export default function (usingRunner: boolean, testDebugLogPath: string, testLogPath: string,
                         $module: ISumanModuleExtended) {

  // SUMAN_SINGLE_PROCESS can call this routine multiple times
  // whereas we return early if not in SSP mode
  // this is ugly, but works for now

  if (usingRunner && callable) {

    callable = false;

    _suman.writeTestError = function (data: string, options: any) {

      // assert(typeof data === 'string', 'Implementation error => data passed to ' +
      //   'writeTestError should already be in string format => \n' + util.inspect(data));

      if(!data){
        data = new Error('falsy data passed to writeTestError').stack;
      }

      if(typeof data !== 'string'){
        data = util.inspect(data);
      }

      options = options || {};
      assert(typeof options === 'object', ' => Options should be an object.');

      if (true || IS_SUMAN_DEBUG) {
        fs.appendFileSync(testDebugLogPath, data);
      }
    };

    _suman._writeLog = function (data: string) {
      // use process.send to send data to runner? or no-op
      if (IS_SUMAN_DEBUG) {
        fs.appendFileSync(testDebugLogPath, data);
      }
    }
  }
  else {

    if (SUMAN_SINGLE_PROCESS) {
      fs.writeFileSync(testLogPath,
        '\n => [SUMAN_SINGLE_PROCESS mode] Next Suman run @' + new Date() +
        '\n Test file => "' + $module.filename + '"', {flag: 'a'});
    }
    else {
      fs.writeFileSync(testLogPath, '\n\n => Test file => "' + $module.filename + '"\n\n', {flag: 'a'});
    }

    _suman._writeLog = function (data: string) {
      fs.appendFileSync(testLogPath, data);
    };

    _suman.writeTestError = function (data: string, ignore: boolean) {
      if (!ignore) {
        _suman.checkTestErrorLog = true;
      }
      // strm.write.apply(strm, arguments);
      if (data) {
        if (typeof data !== 'string') {
          data = util.inspect(data);
        }
        fs.appendFileSync(testDebugLogPath, '\n' + data + '\n');
      }
      else {
        _suman.logError('Suman implementation error => no data passed to writeTestError. Please report.');
      }

    };

    fs.writeFileSync(testDebugLogPath, '\n\n', {flag: 'a', encoding: 'utf8'});
    _suman.writeTestError('\n\n', true);
    _suman.writeTestError(' ### Suman start run @' + new Date(), true);
    _suman.writeTestError(' ### Filename => ' + $module.filename, true);
    _suman.writeTestError(' ### Command => ' + JSON.stringify(process.argv), true);
  }
}


