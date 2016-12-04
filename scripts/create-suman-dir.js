#!/usr/bin/env node


console.log(' => In Suman postinstall script => ', __filename);

//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
const async = require('async');

//project
const sumanUtils = require('suman-utils/utils');

///////////////////////////////////////////////////////////////////////////


const cwd = process.cwd();
const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const p = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(p + '/find-local-suman-executable.js');
const sumanClis = path.resolve(p + '/suman-clis.sh');
const sumanDebugLog = path.resolve(p + '/suman-debug.log');
const sumanClisFile = fs.readFileSync(require.resolve('./suman-clis.sh'));
const findSumanExecFile = fs.readFileSync(require.resolve('./find-local-suman-executable.js'));
const sumanHome = path.resolve(process.env.HOME + '/.suman');

//////////////////////////////////////////////////////////////////////////

fs.mkdir(p, function (err) {

    if (err && !String(err.stack || err).match(/EEXIST/)) {
        throw err;
    }

    async.parallel([

        function (cb) {
            //always want to update this file to the latest version, so always overwrite
            fs.writeFile(sumanClis, sumanClisFile, {flag: 'w'}, cb);
        },
        function (cb) {
            //always want to update this file to the latest version, so always overwrite
            fs.writeFile(findSumanExec, findSumanExecFile, {flag: 'w'}, cb);
        },
        function (cb) {
            fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
                + ', from directory (cwd) => ' + cwd, {flag: 'a'}, cb);
        }


    ], function (err) {

        if (err) {
            fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script failed with error => \n' + (err.stack || err), {flag: 'a'});
            throw err;
        }
        else {

            const n = cp.spawn('sh', [path.resolve(__dirname, 'install-suman-home.sh')], {
                detached: true,
                stdio: ['ignore', fs.openSync(sumanDebugLog, 'a'), fs.openSync(sumanDebugLog, 'a')]
            });


            fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script succeeded', {flag: 'a'});
            process.nextTick(function () {
                process.exit(0);
            });

        }

    })

});
