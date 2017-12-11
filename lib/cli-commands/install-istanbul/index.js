'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var chalk = require("chalk");
var _suman = global.__suman = (global.__suman || {});
var installsGroupA = [
    'install',
    '--save-dev',
    'istanbul@latest',
];
exports.run = function (projectRoot) {
    console.log(' => Installing Istanbul dependency in your local project.');
    if (false && !_suman.sumanOpts.force && !process.env.SUDO_UID) {
        console.log('You may wish to run the the commmand with root permissions, since you are installing globally');
        console.log(' => if using "sudo" makes you unhappy, try "# chown -R $(whoami) $(npm root -g) $(npm root) ~/.npm"');
        console.log(' => To override this message, use --force\n');
        return;
    }
    var i = setInterval(function () {
        process.stdout.write('.');
    }, 500);
    async.parallel([
        function (cb) {
            process.nextTick(cb);
        },
        function (cb) {
            var n = cp.spawn('npm', installsGroupA);
            n.on('close', function (code) {
                clearInterval(i);
                cb.apply(null, arguments);
            });
            n.stderr.setEncoding('utf-8');
            var first = true;
            n.stderr.on('data', function (d) {
                if (first) {
                    first = false;
                    clearInterval(i);
                    console.log('\n');
                }
                console.error(d);
            });
        }
    ], function (err) {
        if (err) {
            console.log('\n', chalk.bgRed.white(' => Error => "Istanbul" was *not* installed ' +
                'successfully =>'), '\n', err.stack || err);
            process.exit(1);
        }
        else {
            console.log('\n\n', chalk.bgBlue.white.bold(' => Suman message => "istanbul" was installed ' +
                'successfully into your local project.'));
            console.log('\n', chalk.bgBlue.white.bold(' => To learn about how to use Istanbul ' +
                'with Suman, visit ***.'), '\n');
            process.exit(0);
        }
    });
};
