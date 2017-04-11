'use strict';

//project
const _suman = global.__suman = (global.__suman || {});
let callable = true;

/////////////////////////////////////////////////////////////////

module.exports = function(code){

  if(callable){
    callable = false;

    console.log('\n\n => Suman cli exiting with code: ', code, '\n\n');
  }

};
