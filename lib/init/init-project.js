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
const _ = require('lodash');
const colors = require('colors/safe');

//#project
const constants = require('../../config/suman-constants');
const sumanUtils = require('../utils');

module.exports = (opts) => {

    const force = opts.force;
    const fforce = opts.fforce;

    const cwd = process.cwd();
    const root = sumanUtils.findProjectRoot(cwd);


    if (!root) {
        console.log('\n => Suman installation fatal error => Suman cannot find the root of your project given your current working directory. ' +
            '\nPlease ensure that you are issuing the installation command from the root of your project.\n\n');
        return;
    }

    //TODO: we need to install babel globally
    //TODO: we need to make sure that root contains package.json file, otherwise tell them they should run npm init first

    var err;

    try {
        require(path.resolve(cwd + '/package.json'));
    }
    catch (err) {
        if (!fforce) {
            console.log(' => Suman message => there is no package.json file in your working directory.');
            console.log(' => Perhaps you wish to run "$ npm init" first, or worse perhaps you are in the wrong directory?');
            console.log(' => To override this use the --fforce option.');

            if (root) {
                console.log('\nIn other words, the current working directory is as follows:');
                console.log(cwd);
                console.log('...but the root of your project appears to be at this path:');
                console.log(root, '\n\n');
            }

            return;
        }
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

    // console.error(' => Suman installation warning => Looks like the project in the current working directory' +
    //     'already has a suman folder. If you wish to overwrite the contents of this folder, then reissue the same command' +
    //     'with the --ff option.');

    if (sumanAlreadyInitted && !fforce) {
        console.log(' => Looks like Suman has already been initialized in this project, and you used the --force option, to re-initialize Suman in this project.');
        console.log(' => If you would like to truly overwrite your current Suman files with the latest defaults, you can re-run init with the --fforce option (not a typo).');
        console.log(' => Before you use the --fforce option, it\'s always a good idea to run a commit with your version control system.');
        return;
    }

    console.log(' => Suman message => Installing suman locally...using "npm install -D suman"...');


    async.parallel([
        function npmInstall(cb) {
            if (os.platform() === 'win32') {
                console.log(' => Suman message => This may take a while if you are on Windows, be patient.');

                cp.exec('cd ' + root + ' && npm install -D suman', function (err, stdout, stderr) {

                    var $err;

                    if (err) {
                        $err += err.stack + '\n';
                        console.error(' => Suman installation error => ' + err.stack);
                    }
                    if (String(stderr).match(/error/i)) {
                        $err += stderr + '\n';
                        console.error(' => Suman installation error => ' + stderr);
                    }
                    if (String(stdout).match(/error/i)) {
                        console.error(' => Suman installation error => ' + stdout);
                    }

                    cb(null, $err);
                });

            }
            else {

                const s = cp.spawn('npm', ['install', '-D', 'suman'], {
                    cwd: root
                });

                // s.stdout.on('data', (data) => {
                //     console.log(String(data));
                // });

                s.stderr.on('data', (data) => {
                    console.error(String(data));
                });

                s.on('close', (code) => {
                    if (code > 0) {  //explicit for your pleasure
                        cb(null, ' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.')
                    }
                    else {
                        cb(null);
                    }

                });
            }


        },
        function installSumanFiles(cb) {
            async.series([
                function (cb) {
                    cp.exec('cd ' + root + '&& rm -rf suman', function (err, stdout, stderr) {
                        if (err || String(stdout).match(/error/i) || String(stderr).match(/error/)) {
                            cb(err || stdout || stderr);
                        }
                        else {
                            cb(null);
                        }
                    });
                },
                function (cb) {
                    fs.mkdir(root + '/suman', function (err) {
                        if (err) {
                            if (!String(err).match(/EEXIST/)) {
                                return cb(err);
                            }
                        }
                        cb(null);
                    });
                },
                function (cb) {
                    async.parallel([
                        function (cb) {
                            async.each([  //formerly async.map
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

                            }, cb);
                        },
                        function (cb) {
                            const msg = 'Readme file here primarily for version control stability. Treat it like a .gitignore file.';
                            fs.writeFile(path.resolve(root + '/suman/.readme'), msg, cb);
                        },
                        function (cb) {
                            fs.appendFile(path.resolve(root + '/.gitignore'), constants.GIT_IGNORE.join('\n'), cb);
                        },
                        function (cb) {
                            fs.mkdir(root + '/suman/examples', function (err) {
                                if (err) {
                                    if (!String(err).match(/EEXIST/)) {
                                        return cb(err);
                                    }
                                }
                                else {

                                    const p = path.resolve(__dirname + '/../../file-examples');

                                    fs.readdir(p, function (err, items) {
                                        if (err) {
                                            cb(err);
                                        }
                                        else {

                                            async.each(items, function (item, cb) {
                                                fs.createReadStream(path.resolve(p + '/' + item))
                                                    .pipe(fs.createWriteStream(path.resolve(root + '/suman/examples/' + item)))
                                                    .once('error', cb).once('finish', cb);
                                            }, cb);
                                        }
                                    });
                                }
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
                                const msg1 = 'Readme file here primarily for version control stability\n';
                                const msg2 = 'Suman recommends that you tail the files in this directory when you\'re developing tests => most useful thing to do is to tail the runner-stderr.log when running tests with the Suman runner,' +
                                    'this is because accessing the individual test errors is less transparent due to the nature of child_processes/subprocesses)';
                                const msg3 = msg1 + '\n' + msg2;

                                async.forEachOf([
                                    '.readme',
                                    'test-stderr.log',
                                    'test-stdout.log',
                                    'runner-stderr.log',
                                    'runner-stdout.log'
                                ], function (item, index, cb) {
                                    fs.writeFile(path.resolve(root + '/suman/logs/' + item), index === 0 ? msg3 : msg2, cb);
                                }, cb);
                            });
                        }
                    ], cb);
                }
            ], cb);

        }

    ], function (err, results) {

        _.flattenDeep(results).forEach(function (item) {
            if (item) {
                console.log('\n' + colors.bgYellow.black(item) + '\n');
            }
        });

        if (err) {
            console.error('\n=> Suman fatal installation error => ' + err.stack);
            process.exit(1);
        }
        else if (results[0]) {
            console.log(colors.bgBlue.green(' => Suman message => despite an NPM error, Suman was successfully installed locally.') + '\n\n');
            process.exit(0);
        }
        else {
            console.log(colors.bgBlue.green(' => Suman message => Suman was successfully installed locally.') + '\n');
            process.exit(0);
        }

    });


};