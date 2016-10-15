/**
 * Created by Olegzandr on 5/26/16.
 */


//core
const http = require('http');
const path = require('path');
const cp = require('child_process');
const util = require('util');

//npm
const colors = require('colors/safe');
const socketio = require('socket.io-client');

//project
const suman = require('../index');

function watch(data, cb) {

    var finished = false;

    function finish(err) {
        if (!finished) {
            finished = true;
            process.nextTick(function () {
                cb(err);
            });
        }
        else if (err) {
            console.log('Error after the fact =>', err.stack || err);
        }
    }

    console.log('data:',data);

    const script = data.script;
    const include = data.include;
    const exclude = data.exclude;


    const opts = global.sumanOpts;
    const testDir = process.env.TEST_DIR;
    const testSrcDir = process.env.TEST_SRC_DIR;
    const testDestDir = process.env.TEST_DEST_DIR;
    const testDirCopyDir = process.env.TEST_DIR_COPY_DIR;
    const root = String(global.projectRoot);

    const targetDir = path.resolve(testDirCopyDir ? testDirCopyDir : (testDir + '-target'));

    if (global.sumanOpts.verbose) {
        console.log('\n\t' + colors.magenta('--watch option set to true'));
    }

    if (!global.sumanOpts.vsparse && global.sumanOpts.all) {
        console.log('\n\t' + ' => ' + colors.magenta('--watch') + ' option set to true => background watcher will be started that will');
        console.log('\t' + '    listen for changes to any file in your ' + colors.blue(' "' + testDir + '" ') + ' directory');

        if (!global.sumanOpts.sparse) {
            console.log('\t => ' + colors.magenta(' --all') + ' option used which always tells Suman to work with ' +
                'the directory specified by the "testDir" property in your config.');
        }

        if (opts.transpile) {
            console.log('\t' + ' => Files will be transpiled to  ' + colors.blue(' "' + targetDir + '" '));
        }
        if (opts.transpile && opts.no_run) {
            console.log('\t => However, since the --no-run option was used, the watcher will only transpile files but not run them.');
        }
        else {
            console.log('\t => Suman will execute any test file that experiences changes observed by the watch process.');
        }
    }


    if (opts.verbose) {
        console.log('Suman will send the following paths to Suman server watch process:', paths);
    }

    suman.Server({

        root: global.projectRoot,
        config: global.sumanConfig
        //TODO: force localhost here!

    }, function (err, val) {

        if (err) {
            console.error('Suman server init error =>', err.stack || err || '');
            finish(err);
        }
        else {

            var runErrors = false;

            setTimeout(function () {
                runErrors = true;
            }, 4000);

            setTimeout(function () {

                const s = socketio('http://' + val.host + ':' + val.port);

                s.once('connect', function () {

                    if (opts.verbose) {
                        console.log('\n', 'Web-socket connection to Suman server successful.', '\n');
                    }

                    if (process.env.SUMAN_DEBUG === 'yes') {
                        console.log(' => Suman about to send watch message to Suman server =>', '\n', util.inspect(opts));
                    }

                    this.once('watch-project-request-received', function (msg) {
                        finish(null, msg);
                    });
                    this.emit('watch-project', JSON.stringify({
                        script: script,
                        transpile: opts.transpile,
                        include: include || null,
                        exclude: exclude || null,

                    }));

                });

                s.once('connect_timeout', function (err) {

                    console.log(' => Suman server connection timeout :(');
                    setTimeout(function () {
                        finish(new Error('connect_timeout' + (err.stack || err || '')));
                    }, 500);

                });

                s.once('connect_error', function (err) {

                    if (runErrors) {
                        console.log(' => Suman server "connect_error":', err.stack);
                        setTimeout(function () {
                            finish(err);
                        }, 5000);
                    }

                });

                s.once('error', function (err) {

                    console.log('\n => Suman server connection "error":', err.stack);
                    console.log('\n\n => Please check your logs/server.log file for more info.');

                    setTimeout(function () {
                        finish(err);
                    }, 500);

                });
            }, 500);
        }

    });

}

module.exports = watch;