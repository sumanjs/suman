'use strict';
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var path = require('path');
var _suman = global.__suman = (global.__suman || {});
module.exports = function (cb) {
    var istanbulInstallPath;
    var executable;
    var opts = _suman.sumanOpts;
    try {
        istanbulInstallPath = require.resolve('istanbul');
        executable = path.resolve(istanbulInstallPath + '/../../.bin/istanbul');
        cp.exec('readlink -f ' + executable, function (err, stdout, stderr) {
            if (err || String(stderr).trim()) {
                cb(err || stderr);
            }
            else {
                if (opts.verbose) {
                    console.log(' => Suman verbose message => install path of instabul => ', istanbulInstallPath);
                }
                cb(null, String(stdout).trim());
            }
        });
    }
    catch (e) {
        cp.exec('which istanbul', function (err, stdout, stderr) {
            if (err || String(stderr).trim()) {
                cb(err || stderr);
            }
            else {
                var exec = String(stdout).trim();
                if (!exec) {
                    console.log('\n', ' => Suman message => Looks like "istanbul" is not installed on your system, ' +
                        'you can run "$ suman --use-istanbul", to acquire the right deps.');
                    console.log('\n', ' => Suman message => If installing "istanbul" manually, you may install locally or globally, ' +
                        'Suman will pick it up either way.');
                    return cb(new Error(' => Fatal error, istanbul executable could not found on your system.'));
                }
                console.log(' => Istanbul executable path => ' + exec);
                cb(null, 'istanbul');
            }
        });
    }
};
