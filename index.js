#!/usr/bin/env node


var fs = require('fs');
var path = require('path');
var args = JSON.parse(JSON.stringify(process.argv.slice(2))); //copy args

var cwd = process.cwd();

var sumanConfig;

try {
    sumanConfig = require(path.resolve(cwd + '/' + 'suman.conf.js'));
}
catch (err) {
    console.error(err);
    return;
}

if (process.argv.indexOf('--server') !== -1 || process.argv.indexOf('-s') !== -1) {
    require('./start-server');
}
else {

    var configPath, dir, index;

    if (index = args.indexOf('--cfg') !== -1) {
        configPath = process.argv[process.argv.indexOf('--cfg') + 1];
        args.splice(index, 2);
    }

    /*   if (index = process.argv.indexOf('--dir') !== -1) {
     dir = process.argv[process.argv.indexOf('--dir') + 1];
     args.splice(index,2);
     }*/


    dir = JSON.parse(JSON.stringify(args));

    if (dir.length < 1) {
        throw new Error('No file or dir specified');
    }
    else  {

        dir = dir.map(function(item){
           return path.resolve(item);
        });

        if(dir.length === 1 && fs.statSync(dir[0]).isFile()){
             require(dir[0]);  //if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
        }
        else{
            var testRunner = require('./lib').Runner;
            testRunner({
                $node_env: process.env.NODE_ENV,
                fileOrDir: dir,
                configPath: configPath || 'suman.conf.js'
            }).on('message', function (msg) {
                console.log('msg from suman runner', msg);
                process.exit(msg);
            });
        }

    }


}

