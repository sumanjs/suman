'use strict';

//dts
import {IAllOpts} from "suman-types/dts/test-suite";
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});


/*////// what it do ///////////////////////////////////////////////


 */////////////////////////////////////////////////////////////////


export const evalOptions = function (arrayDeps: Array<IAllOpts>, opts: IAllOpts){

  const preVal = arrayDeps.filter(function (a: IAllOpts) {
    if(typeof a === 'string'){
      if (/.*:.*/.test(a)) {
        return a;
      }
      if (/:/.test(a)) {
        _suman.logWarning('Looks like you have a bad value in your options as strings =>', util.inspect(arrayDeps))
      }
    }
    else if(su.isObject(a)) {
      Object.assign(opts, a);
    }
    else{
      _suman.logWarning('You included an unexpected value in the array =>', util.inspect(arrayDeps))
    }
  });

  const toEval = `(function self(){return {${preVal.join(',')}}})()`;

  try {
    const obj = eval(toEval);
    //overwrite opts with values from array
    Object.assign(opts, obj);
  }
  catch (err) {
    console.error('\n');
    _suman.logError('Could not evaluate the options passed via strings => ', util.inspect(preVal));
    _suman.logError('Suman will continue optimistically.');
    _suman.logError(err.stack || err);
    console.error('\n');
  }

};
