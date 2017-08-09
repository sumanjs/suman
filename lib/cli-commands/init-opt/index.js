'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');
var async = require('async');
var flattenDeep = require('lodash.flattendeep');
var chalk = require("chalk");
var chmodr = require('chmodr');
var semver = require('semver');
var _suman = global.__suman = (global.__suman || {});
var makeGetLatestSumanVersion = require('./get-latest-suman-version').makeGetLatestSumanVersion;
var makeNPMInstall = require('./install-suman').runNPMInstallSuman;
var writeSumanFiles = require('./install-suman-files').writeSumanFiles;
var determineIfReadlinkAvail = require('./determine-if-readlink-avail').determineIfReadlinkAvail;
var makeAppendToBashProfile = require('./append-to-bash-profile').makeAppendToBashProfile;
var constants = require('../../../config/suman-constants').constants;
var su = require('suman-utils');
var helpers = require('./init-helpers');
var debug = require('suman-debug')('s:init');
var logPermissonsAdvice = helpers.logPermissonsAdvice;
exports.run = function (opts, projectRoot, cwd) {
    var force = opts.force;
    var fforce = opts.fforce;
    if (!projectRoot) {
        console.error('\n');
        _suman.log(chalk.red('Suman installation fatal error => Suman cannot find the root of your project,' +
            ' given your current working directory.'));
        _suman.log(chalk.red('Please ensure that you are issuing the installation command from the root of your project.'));
        _suman.log(chalk.red('Note: You will need to run "$ npm init", or create a package.json file, ' +
            'if your project does not have a package.json file yet.'));
        console.error('\n');
        return;
    }
    if (!force && !process.env.SUDO_UID) {
        logPermissonsAdvice();
    }
    var err;
    try {
        require(path.resolve(projectRoot + '/package.json'));
    }
    catch (err) {
        if (!fforce) {
            console.log(' => Suman message => there is no package.json file in your working directory.');
            console.log(' => Perhaps you wish to run ' + chalk.yellow('"$ npm init"') + ' first, or perhaps you are in the wrong directory?');
            console.log(' => To override this use the --fforce option.');
            if (projectRoot) {
                console.log('\nIn other words, the current working directory is as follows:');
                console.log(chalk.cyan(cwd));
                console.log('...but the root of your project appears to be at this path:');
                console.log(chalk.magenta(projectRoot), '\n\n');
            }
            return;
        }
    }
    var resolved = false;
    var resolvedLocal = false;
    var pkgDotJSON;
    try {
        require.resolve('suman');
        resolved = true;
        pkgDotJSON = require(path.resolve(projectRoot + '/node_modules/suman/package.json'));
        resolvedLocal = true;
    }
    catch (e) {
        err = e;
    }
    if (err) {
        _suman.log('Suman will attempt to install itself to the project in your current working directory.');
    }
    else {
        if (!force && !fforce) {
            console.log(' => Suman init message => Suman NPM package is already installed locally.');
            console.log(chalk.magenta(' => Use the --force option to update to the latest version', '\n\n'));
        }
    }
    var conf, timestamp = String(Date.now()), prependToSumanConf = '', appendToSumanHelpersDir = '', sumanHelperDirFound = false, sumanAlreadyInittedBecauseConfFileExists = false;
    var potentialPathToConf;
    try {
        potentialPathToConf = path.resolve(projectRoot + '/suman.conf.js');
        conf = require(potentialPathToConf);
        sumanAlreadyInittedBecauseConfFileExists = true;
        debug(' => During --init, we have found a pre-existing suman.conf.js file at path ' +
            'file at path => ', potentialPathToConf);
    }
    catch (err) {
        debug(' => Did not find a suman.conf.js (a good thing, since we are initting) ' +
            'file at path => ', potentialPathToConf || (' => implementation error => ' + (err.stack || err)));
    }
    try {
        if (!fforce) {
            var p = path.resolve(projectRoot + '/' + (conf ? (conf.sumanHelpersDir || '/suman') : '/suman'));
            console.log(' => Looking for existing suman helpers dir here => "' + p + '"');
            var files = fs.readdirSync(p);
            sumanHelperDirFound = true;
            files.forEach(function (file) {
                if (!sumanAlreadyInittedBecauseConfFileExists) {
                    sumanAlreadyInittedBecauseConfFileExists = true;
                    console.log(chalk.magenta.bold(' => Looks like this project has already ' +
                        'been initialized as a Suman project.'));
                }
                console.log(' => Your ./suman directory already contains => ' + file);
            });
        }
    }
    catch (err) {
        console.error(' => Could not find your suman helpers dir => We will create a new one.');
    }
    if (sumanAlreadyInittedBecauseConfFileExists && !force) {
        console.log(' => Looks like Suman has already been initialized in this project ' +
            '- do you want to re-initialize Suman in this project?');
        console.log(chalk.cyan(' => If you would like to install the latest Suman files with the latest defaults, ' +
            'you can re-run "$ suman --init" with the --force option.'));
        console.log(chalk.red(' => Before you use --force/--fforce options, it\'s always a good idea to run a commit/tag with your version control system.') + '\n');
        console.log(chalk.red.bold(' => Should you choose to reinitialize, Suman will write out folders with a timestamp for uniqueness,\n    and will not delete' +
            ' any of your files. It is very safe to reinitialize Suman. Please see these instructions => ***'), '\n\n');
        return process.exit(1);
    }
    if (sumanAlreadyInittedBecauseConfFileExists) {
        prependToSumanConf = timestamp + '-';
    }
    if (sumanHelperDirFound) {
        appendToSumanHelpersDir = '-' + timestamp;
    }
    var newSumanHelperDir = '/suman' + appendToSumanHelpersDir;
    var newSumanHelperDirAbsPath = path.resolve(projectRoot + '/suman' + appendToSumanHelpersDir);
    async.series([
        function installFiles(cb) {
            async.parallel([
                writeSumanFiles(newSumanHelperDirAbsPath, prependToSumanConf, newSumanHelperDir, projectRoot),
                makeGetLatestSumanVersion(pkgDotJSON, projectRoot),
                determineIfReadlinkAvail(pkgDotJSON, projectRoot),
                makeAppendToBashProfile(pkgDotJSON, projectRoot)
            ], cb);
        },
        makeNPMInstall(resolvedLocal, pkgDotJSON, projectRoot)
    ], function (err, results) {
        flattenDeep(results).forEach(function (item) {
            item && console.log('\n' + chalk.bgYellow.black(item) + '\n');
        });
        if (err) {
            console.error('\n => Suman fatal installation error => ', (err.stack || err));
            logPermissonsAdvice();
            return process.exit(1);
        }
        else if (results.npmInstall) {
            console.log(chalk.bgYellow.black.bold(' => Suman message => NPM error, most likely a permissions error.') + '\n\n');
            logPermissonsAdvice();
        }
        else {
            console.log('\n\n', chalk.bgBlue.white.bold(' => Suman message => Suman was successfully installed locally.'), '\n\n');
        }
        console.log(['=> Notice the new directory called "suman" in the root of your project.',
            'This directory houses log files used by Suman for debugging tests running',
            'in child processes as well as Suman helper files. Suman recommends moving the ',
            '"suman" directory inside your <test-dir> and renaming it "_suman" or ".suman".',
            'If you elect this option, you should change your suman.conf.js file according to these instructions:',
            ' => http://sumanjs.org/tutorial-01-getting-started.html'].map(function (l, index, a) {
            return (index < a.length - 1) ? chalk.bgBlack.cyan(l) : chalk.bgBlack.yellow(l);
        }).join('\n'), '\n\n');
        process.exit(0);
    });
};
