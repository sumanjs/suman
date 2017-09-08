
import {IGlobalSumanObj} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');


const _suman : IGlobalSumanObj = global.__suman = (global.__suman || {});

///////////////////////////////////////////////////////////////////////

export const getProjectModule = function(): any {

  try{
    return require(_suman.projectRoot);
  }
  catch(err){
    console.error('\n',err.stack || err,'\n');
    return null;
  }

};
