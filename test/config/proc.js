/**
 * Created by denman on 12/3/2015.
 */

var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');

var async = require('async');




process.on('message',function(msg){

    console.log('message:',msg);


});

var buf = new Buffer(500000*1024*1024);


var http = require('http');


http.createServer().listen(5006);


function dogs(){

    setTimeout(function(){
        var buf = new Buffer(100*1000);
        //console.log(buf);
        dogs();
    },2);
}

dogs();


