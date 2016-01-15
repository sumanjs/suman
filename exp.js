/**
 * Created by denman on 12/30/2015.
 */

//
//var json = require('./config/suman.json');
//
////process.stdout.write(JSON.stringify(json).replace(/"/g,''));
//
//process.stdout.write(String(json));


var async = require('async');


//try{
//
//    async.parallel([
//        function(cb){
//            //setTimeout(function(){
//            //    cb();
//            //},200);
//            cb();
//        }
//
//    ],function complete(){
//        throw new Error('foo');
//    });
//
//
//}
//catch(err){
//    console.error('trapped:',err);
//}



var domain = require('domain');


domain.create().on('error',function(err){
    console.log('trapped by domain:',err.stack);

    //throw new Er

}).run(function(){

    try{

        async.parallel([
            function(cb){
                setTimeout(function(){
                    throw new Error('foo');
                    cb();
                },200);
                //throw new Error('foo');
                //cb();

                //cb();
            }

        ],function complete(){

        });


    }
    catch(err){
        console.error('trapped by try/catch:',err);
    }

});