/**
 * Created by amills001c on 11/30/15.
 */


var _ = require('underscore');
var async = require('async');


//var sliced = process.argv.slice(1).concat(3);
//
//console.log(sliced);


//async.parallel([function (cb) {
//
//    setTimeout(function(){
//        cb(null,new Error('dum'));
//    },1000);
//
//}, function (cb) {
//    setTimeout(function(){
//        cb(null,new Error('dum'));
//    },1000);
//
//}], function done(err, results) {
//   console.log(err,results);
//})
//
//
//async.series([function (cb) {
//
//    setTimeout(function(){
//        cb(null,new Error('dum'));
//    },200);
//
//}, function (cb) {
//    setTimeout(function(){
//        cb(null,new Error('dum'));
//    },200);
//
//}], function done(err, results) {
//    console.log(err,results);
//});


//
//async.each([1,2,3], function(value,cb){
//    setTimeout(function(){
//        cb(value);
//    },200);
//
//},function done(err, results) {
//    console.log(err,results);
//});

//
//var arr = [new Error('1'),new Error('2'),new Error('3'),'mark'];
//
//arr = arr.filter(function (err) {
//    if(err instanceof Error){
//        return err;
//    }
//    else{
//        throw new Error('non error passed');
//    }
//}).map(function(err){
//    return err.message;
//});
//
//console.log(arr);

const v8flags = require('v8flags');

v8flags(function (err, results) {
    //console.log(results);  // [ '--use_strict',
    //   '--es5_readonly',
    //   '--es52_globals',
    //   '--harmony_typeof',
    //   '--harmony_scoping',
    //   '--harmony_modules',
    //   '--harmony_proxies',
    //   '--harmony_collections',
    //   '--harmony',
    // ...

    var res = _.sortBy(results, function (name) {
        return name
    });

    console.log(res);
});


console.log(new Date(Date.now()-100000));