/**
 * Created by denmanm1 on 3/20/16.
 */


//#core
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const spawn = require('cross-spawn');
const os = require('os');

//#npm
const async = require('async');

//#project
const sumanUtils = require('../utils');

module.exports = (opts) => {

    const force = opts.force;
    const fforce = opts.fforce;

    const root = sumanUtils.findProjectRoot(process.cwd());

    const cwd = process.cwd();

    //TODO: we need to install babel globally
    //TODO: we need to make sure that root contains package.json file, otherwise tell them they should run npm init first

    var err;

    try {
        require(path.resolve(cwd + '/package.json'));
    }
    catch (err) {
        console.log(' => Suman message => there is no package.json file in your working directory.');
        console.log(' => Perhaps you are in the wrong directory?');
        console.log(' => At the moment, it looks like the root of your project is here: ' + root);
        console.log(' => To use this value as project root use the --force option, otherwise cd into the correct directory and reissue the ' +
            '$ suman --uninstall command.');
        return;
    }

    if (!force) {
        console.log('=> Suman warning => you are about to uninstall suman from your local project.');
        console.log('=> Suman warning => This routine will delete the following items:');
        console.log('=> suman/ and all its contents');
        console.log('=> test-target/ and all its contents');
        console.log('=> suman.conf.js');
        console.log('\n', 'To proceed please use the --force option.');
        return;
    }

    console.log(' => Suman message => Uninstalling suman locally...using "npm uninstall --save-dev --save suman"...');

    if (os.platform() === 'win32') {
        console.log(' => Suman message => This may take a while if you are on Windows, be patient.');

        cp.exec('cd ' + cwd + ' && npm uninstall --save-dev --save suman', function (err, stdout, stderr) {

            if (err) {
                console.error(' => Suman installation error => ' + err.stack);
            }
            else if (String(stderr).match(/error/i)) {
                console.error(' => Suman installation error => ' + stderr);
            }
            else if (String(stdout).match(/error/i)) {
                console.error(' => Suman installation error => ' + stdout);
            }
            else {
                console.log(stdout);
                run();
            }
        });

    }
    else {

        const s = cp.spawn('npm', ['uninstall', '--save-dev', '--save', 'suman'], {
            cwd: cwd
        });

        s.stdout.on('data', (data) => {
            console.log(String(data));
        });

        s.stderr.on('data', (data) => {
            console.error(String(data));
        });

        s.on('close', (code) => {
            if (code < 1) {  //explicit for your pleasure
                run();
            }
            else {
                console.error(' => Suman installation error => NPM install script exited with non-zero code: ' + code);
            }
        });
    }


    function run(err) {

        if (err) {
            if (!String(err).match(/EEXIST/)) {
                throw err;
            }
        }

        async.series([
            function (cb) {
                process.nextTick(cb);
            },
            function (cb) {
                async.parallel([
                    function (cb) {
                        cp.exec('rm -rf suman', function (err, stdout, stderr) {
                            if (err) {
                                cb(err);
                            }
                            else if (String(stdout).match(/error/i)) {
                                cb(stdout);
                            }
                            else if (String(stderr).match(/error/i)) {
                                cb(stderr);
                            }
                            else {
                                cb(null);
                            }
                        });
                    },
                    function (cb) {
                        cp.exec('rm -rf test-target', function (err, stdout, stderr) {
                            if (err) {
                                cb(err);
                            }
                            else if (String(stdout).match(/error/i)) {
                                cb(stdout);
                            }
                            else if (String(stderr).match(/error/i)) {
                                cb(stderr);
                            }
                            else {
                                cb(null);
                            }
                        });
                    },
                    function (cb) {
                        fs.unlink(cwd + '/suman.conf.js', function (err) {
                            if (err) {
                                if (!String(err).match(/EEXIST/)) {
                                    return cb(err);
                                }
                            }
                            cb(null);
                        });
                    }
                ], cb);
            }
        ], function (err) {

            if (err) {
                console.error('=> Suman uninstall fatal error => ' + err.stack);
                return process.exit(1);
            }

            console.log(' => Suman has been successfully uninstalled.');
            process.exit(0);

        });

    }

};