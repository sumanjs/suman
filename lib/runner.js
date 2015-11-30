/**
 * Created by amills001c on 11/24/15.
 */


var fs = require('fs');
var cp = require('child_process');
var path = require('path');


function makeExit(messages){

    var err = false;

    messages.forEach(function(msg){
        if(msg.errors.length > 0){
            err = true
        }
        console.log(msg);

    });

    if(err){
        process.exit(1);
    }
    else{
        process.exit(0);
    }

}


function findTestsAndRunThem(dir,grep){

    var testSuitesToRun = [];

    dir = path.resolve(dir);

    if(fs.statSync(dir).isFile()){

        var n = cp.fork(dir, process.argv.slice(2), {
            env: {
                'NODE_ENV': process.env.NODE_ENV
            }
        });

        n.on('message',function(msg){
            makeExit([msg]);
        });

    }
    else{

        var messages = [];
        var files = [];

        fs.readdirSync(dir).forEach(function(file){
            file = path.resolve(dir + '/' + file);
            if(fs.statSync(file).isFile() && path.extname(file) === '.js') {
                files.push(file);
            }
        });

        files.forEach(function(file){
            var n = cp.fork(file, process.argv.slice(2), {
                env: {
                    'NODE_ENV': process.env.NODE_ENV
                }
            });

            n.on('message',function(msg){
                messages.push(msg);
                if(messages.length >= files.length){
                    makeExit(messages);
                }
            });
        })

    }

}


module.exports = findTestsAndRunThem;