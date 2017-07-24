
import {IGlobalSumanObj} from "../../dts/global";


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
