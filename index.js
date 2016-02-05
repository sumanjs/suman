#!/usr/bin/env node


if(require.main !== module){
    //prevents users from fucking up by accident and getting in an infinite loop that will lock up their system
    return;
}

console.log('Suman running...');

var fs = require('fs');
var path = require('path');
var colors = require('colors/safe');

////////////////////////////////////////////////////////////////////

var args = JSON.parse(JSON.stringify(process.argv.slice(2))); //copy args
var cwd = process.cwd();

////////////////////////////////////////////////////////////////////

var suman = require('./lib');

var sumanConfig, configPath, index;


if (args.indexOf('--cfg') !== -1) {
    index = args.indexOf('--cfg');
    configPath = args[index + 1];
    args.splice(index, 2);
}

try {
    var pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
    sumanConfig = require(pth);
    if(sumanConfig.verbose !== false){  //default to true
        console.log(colors.cyan('Suman config used: ' + pth +'\n'));
    }
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

    dir = JSON.parse(JSON.stringify(args)); //whatever args are remaining are assumed to be file or directory paths to tests

    if (dir.length < 1) {
        console.error('   ' + colors.bgCyan('Suman error => No file or dir specified at command line'));
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

