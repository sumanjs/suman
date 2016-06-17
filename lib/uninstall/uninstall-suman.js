/**
 * Created by denmanm1 on 3/20/16.
 */


//#core
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');

//#npm
const async = require('async');
const colors = require('colors');

//#project
const sumanUtils = require('../utils');

module.exports = opts => {

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

    async.series([
        function (cb) {
            process.nextTick(cb);
        },
        function (cb) {
            async.parallel([
                function (cb) {
                    if (os.platform() === 'win32') {

                        console.log(' => Suman message => This may take a while if you are on Windows, be patient.');
                        cp.exec('cd ' + cwd + ' && npm uninstall --save-dev --save suman', function (err, stdout, stderr) {

                            if (err) {
                                console.error(' => Suman installation error => ' + err.stack);
                            }
                            if (String(stderr).match(/error/i)) {
                                console.error(' => Suman installation error => ' + stderr);
                            }
                            if (String(stdout).match(/error/i)) {
                                console.error(' => Suman installation error => ' + stdout);
                            }

                            console.log(stdout);
                            cb(null);
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
                            if (code > 0) {  //explicit for your pleasure
                                console.error(' => Suman installation error => NPM install script exited with non-zero code: ' + code);
                            }
                            cb(null);
                        });
                    }
                },
                function (cb) {
                    cp.exec('rm -rf suman', function (err, stdout, stderr) {
                        if (err) {
                            console.error(err.stack);
                        }
                        if (String(stdout).match(/error/i)) {
                            console.error(stdout);
                        }
                        if (String(stderr).match(/error/i)) {
                            console.error(stderr);
                        }

                        cb(null);

                    });
                },
                function (cb) {
                    cp.exec('rm -rf test-target', function (err, stdout, stderr) {
                        if (err) {
                            console.error(err.stack);
                        }
                        if (String(stdout).match(/error/i)) {
                            console.error(stdout);
                        }
                        if (String(stderr).match(/error/i)) {
                            console.error(stderr);
                        }

                        cb(null);
                    });
                },
                function (cb) {
                    fs.unlink(cwd + '/suman.conf.js', function (err) {
                        if (err) {
                            console.error(err.stack);
                        }
                        cb(null);
                    });
                }
            ], cb);
        }
    ], function (err) {

        if (err) {
            console.error('=> Suman uninstall error => ' + err.stack);
            process.exit(1);
        }
        else {
            console.log('\n' + colors.bgGreen.white(' => Suman has been successfully uninstalled.') + '\n');
            process.exit(0);
        }


    });

};