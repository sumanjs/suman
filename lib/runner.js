/**
 * Created by amills001c on 11/24/15.
 */


global.describe = require('./ntf').describe;

var fs = require('fs');
var cp = require('child_process');
var path = require('path');

var testSuitesToRun = [];


function findTestsAndRunThem(dir,grep){

    dir = path.resolve(dir);

    console.log('dir:',dir);

    if(fs.statSync(dir).isFile()){
        cp.fork(dir);
        //require(dir);
    }
    else{
        fs.readdirSync(dir).forEach(function(file){
            file = path.resolve(dir + '/' + file);
            cp.fork(file);
        });

    }


}


module.exports = findTestsAndRunThem;