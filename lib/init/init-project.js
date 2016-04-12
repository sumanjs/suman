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

    //TODO: we need to install babel globally
    //TODO: we need to make sure that root contains package.json file, otherwise tell them they should run npm init first

    var err;

    try {
        require(path.resolve(root + '/package.json'));
    }
    catch (err) {
        console.log(' => Suman message => there is no package.json file in your working directory.');
        console.log(' => Perhaps you wish to run "$ npm init" first?');
        console.log(' => To override this use the --force option.');
        return;
    }

    try {
        //TODO: what if it recognizes global modules as well as local ones?
        require.resolve('suman');
    }
    catch (e) {
        err = e;
    }

    if (err) {
        console.log(' => Suman message => Suman will attempt to install itself to the project in your current working directory.');
    }
    else {
        //TODO: only write out suman.x.js if it doesn't already exist
        console.log(' => Suman init message => Suman is already installed locally.');
        console.log(' => Use the --force option to overwrite to latest version');
        return;
    }

    var sumanAlreadyInitted = false;

    try {
        const conf = fs.readFileSync(path.resolve(root + '/suman.conf.js'));
        sumanAlreadyInitted = true;
    }
    catch (err) {

    }

    try {
        if (!force) {
            const files = fs.readdirSync(path.resolve(root + '/suman'));
            files.forEach(function (file) {
                if (!sumanAlreadyInitted) {
                    sumanAlreadyInitted = true;
                    console.log(' => Looks like this project has already been initialized as a Suman project.');
                }
                console.log(' => Your ./suman directory already contains => ' + file);
            });
        }

    }
    catch (err) {

    }

    if (sumanAlreadyInitted && !force) {
        console.log(' => If you would like to overwrite your current Suman files with the latest defaults, you can re-run init with the --force option.');
        console.log(' => Before you use the --force option, it\'s always a good idea to run a commit with your version control system.');
        return;
    }

    console.log(' => Suman message => Installing suman locally...using "npm install -D suman"...');


    const s = cp.spawn('npm', ['install', '-D', 'suman'], {
        cwd: root
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


    function run(err) {

        if (err) {
            if (!String(err).match(/EEXIST/)) {
                throw err;
            }
        }


        fs.mkdir(root + '/suman', function (err) {

            if (err) {
                if (!String(err).match(/EEXIST/)) {
                    console.error(' => Suman installation warning => Looks like the project in the current working directory' +
                        'already has a suman folder. If you wish to overwrite the contents of this folder, then reissue the same command' +
                        'with the --ff option.');
                    process.exit(1);
                }
            }


            async.map([
                {
                    src: 'default-conf-files/suman.default.conf.js',
                    dest: 'suman.conf.js'
                },
                {
                    src: 'default-conf-files/suman.default.ioc.js',
                    dest: 'suman/suman.ioc.js'
                },
                {
                    //TODO: suman.order.js should be suman.constaints.js ?
                    src: 'default-conf-files/suman.default.order.js',
                    dest: 'suman/suman.order.js'
                },
                {
                    src: 'default-conf-files/suman.default.once.js',
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

                console.log(' => Suman message => suman successfully installed locally.');
                process.exit(0);


            });


        });
    }


};