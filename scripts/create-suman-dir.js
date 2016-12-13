#!/usr/bin/env node


//core
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

//npm
//
const async = require('async');

//project
const sumanUtils = require('suman-utils/utils');

///////////////////////////////////////////////////////////////////////////

const cwd = process.cwd();
const userHomeDir = path.resolve(sumanUtils.getHomeDir());
const p = path.resolve(userHomeDir + '/.suman');
const findSumanExec = path.resolve(p + '/find-local-suman-executable.js');
const sumanClis = path.resolve(p + '/suman-clis.sh');
const findProjectRootDest = path.resolve(p + '/find-project-root.js');
const sumanDebugLog = path.resolve(p + '/suman-debug.log');
const sumanClisFile = fs.readFileSync(require.resolve('./suman-clis.sh'));
const findSumanExecFile = fs.readFileSync(require.resolve('./find-local-suman-executable.js'));
const findProjectRoot = fs.readFileSync(require.resolve('./find-project-root.js'));
const sumanHome = path.resolve(process.env.HOME + '/.suman');
const queue = path.resolve(process.env.HOME + '/.suman/install-queue.txt');

const debug = require('suman-debug');
const debugPostinstall = debug('s:postinstall');

//////////////////////////////////////////////////////////////////////////////////////////////////

debugPostinstall(' => In Suman postinstall script, cwd => ', cwd);
debugPostinstall(' => In Suman postinstall script => ', __filename);
debugPostinstall(' => Suman home dir path => ', p);

fs.mkdir(p, function (err) {

    if (err && !String(err.stack || err).match(/EEXIST/)) {
        throw err;
    }

    debugPostinstall(' => Beginning of Suman post-install script');

    async.parallel([

        function (cb) {
            //always want to update this file to the latest version, so always overwrite
            fs.writeFile(sumanClis, sumanClisFile, {flag: 'w', flags: 'w'}, cb);
        },
        function (cb) {
            //always want to update this file to the latest version, so always overwrite
            fs.writeFile(findSumanExec, findSumanExecFile, {flag: 'w', flags: 'w'}, cb);
        },
        function (cb) {
            fs.writeFile(sumanDebugLog, '\n\n => Suman post-install script run on ' + new Date()
                + ', from directory (cwd) => ' + cwd, {flag: 'a'}, cb);
        },
        function (cb) {
            // assume we want to create the file if it doesn't exist, and just write empty string
            fs.writeFile(queue, '', {flag: 'a', flags: 'a'}, cb);
        },
        function (cb) {
            fs.writeFile(findProjectRootDest, findProjectRoot, {flag: 'w', flags: 'w'}, cb);
        }


    ], function (err) {

        if (err) {
            fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script failed with error => \n' + (err.stack || err), {flag: 'a'});
            console.error(err.stack || err);
            process.exit(1);
        }
        else {

            if (fs.existsSync(sumanHome)) {
                debugPostinstall(' => ~/.suman dir exists!');
                process.exit(0);
            }
            else {
                debugPostinstall(' => Warning => ~/.suman dir does not exist!');
                process.exit(1)
            }

        }

    })

});
