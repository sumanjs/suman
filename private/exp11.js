/**
 * Created by olegzandr on 12/3/16.
 */


const async = require('async');


 async.parallel([], function(err){
    if(err){
        throw err;
    }

    console.log('done');
});
