import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

///////////////////////////////////////////////////////////////////////

export const getProjectModule = function (): any {

  try {
    return require(_suman.projectRoot);
  }
  catch (err) {
    _suman.logError('\n', err.stack || err, '\n');
    return null;
  }

};

export const lastDitchRequire = function (dep: string, requestorName: string): any {

  requestorName = requestorName || '';

  try {
    return require(dep);
  }
  catch (err) {
    try {
      //retry, replacing characters
      return require(String(dep).replace(/_/g, '-'));
    }
    catch (err) {
      _suman.logError(`'${requestorName}' warning => cannot require dependency with name => '${dep}'.`);
      _suman.logError('despite the missing dependency, Suman will continue optimistically.');
      console.error('\n');
      return null;
    }
  }

};
