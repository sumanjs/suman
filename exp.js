/**
 * Created by denman on 12/30/2015.
 */


//console.error(new Error('joe').stack);


var async = require('async');



async.map([1,2,3],function(val,cb){

    setTimeout(function(){
        console.log(val);
        //cb(null,val+1);
    });

},function complete(err,results){

    console.log('results:',results);

});