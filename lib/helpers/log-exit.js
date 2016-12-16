/**
 * Created by oleg on 12/15/16.
 */


var callable = true;

module.exports = function(code){

  if(callable){
    callable = false;

    console.log('\n\n => Suman exiting with code: ', code, '\n\n');
  }

};
