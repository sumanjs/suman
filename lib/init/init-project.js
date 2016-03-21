/**
 * Created by amills001c on 3/20/16.
 */


//#core
const fs = require('fs');
const cp = require('child_process');
const path = require('path');

//#npm
const async = require('async');

//#project
const sumanUtils = require('../utils');

module.exports = (opts) => {

    const force = opts.force;
    const root = sumanUtils.findProjectRoot(process.cwd());

    //TODO: we need to make sure that root contains package.json file, otherwise tell them they should run npm init first

    var err;

    try {
        require.resolve('suman');
    }
    catch (e) {
        err = e;
    }

    if (err) {

    }
    else {
        console.log(' => Suman init message => Suman is already installed locally, will overwrite to latest version.');
    }

    var sumanAlreadyInitted = false;


    try {
        const conf = fs.readFileSync(path.resolve(root + '/suman.conf.js'));
        sumanAlreadyInitted = true;
    }
    catch (err) {

    }

    try {
        const files = fs.readdirSync(path.resolve(root + '/suman'));
        files.forEach(function (file) {
            if (!sumanAlreadyInitted) {
                sumanAlreadyInitted = true;
                console.log(' => Looks like this project has already been initialized as a Suman project.');
            }
            console.log('Your ./suman directory contains => ' + file);
        });
    }
    catch (err) {

    }

    if (sumanAlreadyInitted && !force) {
        console.log(' => If you would like to overwrite your current Suman files with the latest defaults, you can re-run init with the --force option.');
        console.log(' => Before you use the --force option, it\'s always a good idea to run a commit with your version control system.');
        return;
    }

    console.log(' => Suman => Installing suman locally...using "npm install -D suman"...');
    cp.exec('cd ' + root + ' && npm install -D suman', function (err, stdout, stderr) {

        if (err) {
            if (!String(err).match(/EEXIST/)) {
                throw err;
            }
        }

        if (String(stdout).match(/Error/i)) {
            throw new Error(stdout);
        }

        if (String(stderr).match(/Error/i)) {
            throw new Error(stderr);
        }

        console.log(' => Suman => suman successfully installed locally.');

        fs.mkdir(root + '/suman', function (err) {

            if (err) {
                if (!String(err).match(/EEXIST/)) {
                    throw err;
                }
            }

            async.map([
                {
                    src: 'suman.default.conf.js',
                    dest: 'suman.conf.js'
                },
                {
                    src: 'suman.default.ioc.js',
                    dest: 'suman/suman.ioc.js'
                },
                {
                    src: 'suman.default.order.js',   //TODO: suman.order.js should be suman.constaints.js ?
                    dest: 'suman/suman.order.js'
                },
                {
                    src: 'suman.default.once.js',
                    dest: 'suman/suman.once.js'
                }

            ], function (item, cb) {

                fs.createReadStream(path.resolve(__dirname + '/../../' + item.src))
                    .pipe(fs.createWriteStream(path.resolve(root + '/' + item.dest)))
                    .once('error', cb).once('finish', cb);

            }, function complete(err, results) {

                if (err) {
                    throw err;
                }
                else {
                    console.log('Results:', results);
                }


            });


        });

    });


};