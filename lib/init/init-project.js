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
    //const root = sumanUtils.findProjectRoot(process.cwd());

    const root = process.cwd();

    //TODO: we need to install babel globally
    //TODO: we need to make sure that root contains package.json file, otherwise tell them they should run npm init first

    var err;

    try {
        require(path.resolve(root + '/package.json'));
    }
    catch (err) {
        console.log(' => Suman message => there is no package.json file in your working directory.');
        console.log(' => Perhaps you wish to run "$ npm init" first, or worse perhaps you are in the wrong directory?');
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
        if (!force && !fforce) {
            console.log(' => Suman init message => Suman is already installed locally.');
            console.log(' => Use the --force option to overwrite to latest version');
            return;
        }
    }

    var sumanAlreadyInitted = false;

    try {
        const conf = fs.readFileSync(path.resolve(root + '/suman.conf.js'));
        sumanAlreadyInitted = true;
    }
    catch (err) {

    }

    try {
        if (!fforce) {
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

    if (sumanAlreadyInitted && !fforce) {
        console.log(' => Looks like Suman has already been initialized in this project, and you used the --force option, to re-initialize Suman in this project.');
        console.log(' => If you would like to truly overwrite your current Suman files with the latest defaults, you can re-run init with the --fforce option (not a typo).');
        console.log(' => Before you use the --fforce option, it\'s always a good idea to run a commit with your version control system.');
        return;
    }

    console.log(' => Suman message => Installing suman locally...using "npm install -D suman"...');

    if (os.platform() === 'win32') {
        console.log(' => Suman message => This may take a while if you are on Windows, be patient.');

        cp.exec('cd ' + root + ' && npm install -D suman', function (err, stdout, stderr) {

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
    }


    function run(err) {

        if (err) {
            if (!String(err).match(/EEXIST/)) {
                throw err;
            }
        }

        async.series([
            function (cb) {
                fs.mkdir(root + '/suman', function (err) {
                    if (err) {
                        if (!String(err).match(/EEXIST/)) {
                            console.error(' => Suman installation warning => Looks like the project in the current working directory' +
                                'already has a suman folder. If you wish to overwrite the contents of this folder, then reissue the same command' +
                                'with the --ff option.');
                            return cb(err);
                        }
                    }
                    cb(null);
                });
            },
            function (cb) {
                async.parallel([
                    function (cb) {
                        fs.mkdir(root + '/suman/examples', function (err) {
                            if (err) {
                                if (!String(err).match(/EEXIST/)) {
                                    return cb(err);
                                }
                            }
                            cb(null);
                        });
                    },
                    function (cb) {
                        fs.mkdir(root + '/suman/logs', function (err) {
                            if (err) {
                                if (!String(err).match(/EEXIST/)) {
                                    return cb(err);
                                }
                            }
                            //we also just overwrite stdio logs
                            const msg = '(We recommend you tail these files when you\'re developing tests => most useful thing to do is to tail the runner-stderr.log when running tests with the Suman runner)';

                            async.each([
                                'test-stderr.log',
                                'test-stdout.log',
                                'runner-stderr.log',
                                'runner-stdout.log'
                            ], function (item, cb) {
                                fs.writeFile(path.resolve(root + '/suman/logs/' + item), msg, cb);
                            }, cb);
                        });
                    }
                ], cb);
            }
        ], function (err) {

            if (err) {
                console.error('=> Suman fatal error => ' + err.stack);
                return process.exit(1);
            }

            async.map([
                {
                    src: 'default-conf-files/suman.default.conf.js',
                    dest: 'suman.conf.js'
                },
                {
                    src: 'default-conf-files/suman.default.reporters.js',
                    dest: 'suman/suman.reporters.js'
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
                    console.error(' => Suman fatal error => ', err.stack);
                    process.exit(1);
                }
                else {
                    console.log(' => Suman message => suman successfully installed locally.');
                    process.exit(0);
                }
            });

        });

    }

};