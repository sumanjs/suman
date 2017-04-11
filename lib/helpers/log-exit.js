/**
 * Created by oleg on 12/15/16.
 */


let callable = true;

module.exports = function(code){

  if(callable){
    callable = false;

    console.log('\n\n => Suman cli exiting with code: ', code, '\n\n');
  }

};
