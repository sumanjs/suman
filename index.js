#!/usr/bin/env node


var fs = require('fs');
var path = require('path');
var colors = require('colors/safe');

////////////////////////////////////////////////////////////////////

var args = JSON.parse(JSON.stringify(process.argv.slice(2))); //copy args
var cwd = process.cwd();

////////////////////////////////////////////////////////////////////

var suman = require('./lib');

var sumanConfig, configPath, index;


console.log('1  => ' + args);

console.log('1.1  => ' + args[0]);

if (args.indexOf('--cfg') !== -1) {
    index = args.indexOf('--cfg');
    configPath = args[index + 1];
    args.splice(index, 2);
}

console.log('2  => ' + args);

try {
    var pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
    sumanConfig = require(pth);
    console.log('Config used: ' + pth);
    //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
}
catch (err) {
    console.error('\n => ' + err + '\n');
    console.error('   ' + colors.bgCyan.black('Suman error => Could not find path to your config file given by --cfg at the command line.'));
    return;
}


if (args.indexOf('--server') !== -1 || args.indexOf('-s') !== -1) {

    suman.Server({
        //configPath: 'suman.conf.js',
        config: sumanConfig,
        serverName: 'localhost'
    }).on('msg', function (msg) {
        console.log('msg from suman server', msg);
        switch (msg) {
            case 'listening':
                process.exit();
                break;
            default:
                console.log(msg);
        }
    });

}
else {

    var dir, grepFile, index, useRunner;

    if (args.indexOf('--grep-file') !== -1) {
        index = args.indexOf('--grep-file');
        grepFile = args[index + 1];
        args.splice(index, 2);
    }

    if (args.indexOf('--rnr') !== -1) {
        index = args.indexOf('--rnr');
        useRunner = true;
        args.splice(index, 1);
    }

    console.log(args);

    dir = JSON.parse(JSON.stringify(args)); //whatever args are remaining are assumed to be file or directory paths to tests

    if (dir.length < 1) {
        throw new Error('No file or dir specified');
        return;
    }
    else {

        dir = dir.map(function (item) {
            return path.resolve(item);
        });

        if (!useRunner && dir.length === 1 && fs.statSync(dir[0]).isFile()) {
            require(dir[0]);  //if only 1 item and the one item is a file, we don't use the runner, we just run that file straight up
        }
        else {
            suman.Runner({
                grepFile: grepFile,
                $node_env: process.env.NODE_ENV,
                fileOrDir: dir,
                config: sumanConfig,
                //configPath: configPath || 'suman.conf.js'
            }).on('message', function (msg) {
                console.log('msg from suman runner', msg);
                process.exit(msg);
            });
        }

    }


}

