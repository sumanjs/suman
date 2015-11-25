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

    if(fs.statSync(dir).isFile()){
        cp.fork(dir);
    }
    else{

        fs.readdirSync(dir).forEach(function(file){
            file = path.resolve(dir + '/' + file);
            if(fs.statSync(file).isFile() && path.extname(file) === '.js') {
                cp.fork(file);
            }
        });

    }

}


module.exports = findTestsAndRunThem;