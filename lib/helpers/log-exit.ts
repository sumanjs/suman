'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});
let callable = true;

/////////////////////////////////////////////////////////////////

export = function(code: number){

  if(callable){
    callable = false;

    console.log('\n\n => Suman cli exiting with code: ', code, '\n\n');
  }

};
