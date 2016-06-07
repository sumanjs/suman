/**
 * Created by Olegzandr on 5/26/16.
 */


//core
const http = require('http');
const path = require('path');
const cp = require('child_process');

//npm
const colors = require('colors/safe');

//project
const suman = require('../index');

function watch(paths, cb) {

    const opts = global.sumanOpts;
    const testDir = global._sTestDir;
    const testSrcDir = global._sTestSrcDir;
    const testDestDir = global._sTestDestDir;
    const testDirCopyDir = global._sTestDirCopyDir;
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

    if (opts.all) {
        paths = [testDir]
    }
    else {
        if (paths.length < 1) {
            return cb(new Error('No paths argument(s) for watching => If you wish to watch all files, use the --all option, \n    otherwise pass in' +
                ' an argument pertaining to which file or directory you wish to watch.'));
        }
        paths = paths.map(function (p) {
            return path.resolve(path.isAbsolute(p) ? p : (root + '/' + p));
        });
    }

    if (opts.verbose) {
        console.log('Suman will send the following paths to Suman server watch process:', paths);
    }

    var finished = false;

    function finish(err) {
        if (!finished) {
            finished = true;
            cb(err);
        }
    }

    suman.Server({

        //TODO: force localhost here!

    }).on('connect', function () {

        if (opts.verbose) {
            console.log('\n', 'Web-socket connection to Suman server successful.', '\n');
        }

        this.emit('watch', JSON.stringify({
            paths: paths,
            transpile: opts.transpile
        }));

        finish();

    }).on('connect_timeout', function (err) {

        console.log(' => Suman server connection timeout :(');
        finish(new Error('connect_timeout' + (err.stack || err || '')));

    }).on('connect_error', function (err) {

        if (!String(err.message).match(/xhr poll error/i)) {
            console.log(' => Suman server connection error: ' + err.stack);
        }

        setTimeout(function () {
            finish(err);
        }, 3000);

    }).on('error', function (err) {

        console.log('\n => Suman server connection error: ' + err.stack);
        console.log('\n\n => Please check your logs/server.log file for more info.');

        if (String(err.message).match(/xhr poll error/i)) {
            setTimeout(function () {
                finish(err);
            }, 3000);
        }
        else {
            console.log(' => Suman server connection error: ' + err.stack);
            setTimeout(function () {
                finish(err);
            }, 1000);
        }

    });


}

module.exports = watch;