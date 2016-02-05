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

    var configPath, dir, grepFile, index;

    if (index = args.indexOf('--cfg') !== -1) {
        configPath = process.argv[process.argv.indexOf('--cfg') + 1];
        args.splice(index - 1, 2);
    }

    if (index = process.argv.indexOf('--grep-file') !== -1) {
        grepFile = process.argv[process.argv.indexOf('--grep-file') + 1];
        args.splice(index -1, 2);
    }


    dir = JSON.parse(JSON.stringify(args)); //whatever args are remaining are assumed to be file or directory paths to tests


    if (dir.length < 1) {
        throw new Error('No file or dir specified');
    }
    else {

        dir = dir.map(function (item) {
            return path.resolve(item);
        });

        if (dir.length === 1 && fs.statSync(dir[0]).isFile()) {
            require(dir[0]);  //if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
        }
        else {
            var testRunner = require('./lib').Runner;
            testRunner({
                grepFile: grepFile,
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

