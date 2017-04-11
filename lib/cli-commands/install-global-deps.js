'use strict';
var cp = require('child_process');
var path = require('path');
var async = require('async');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var p = path.resolve(process.env.HOME + '/.suman/global');
module.exports = function (deps) {
    if (deps.length < 1) {
        console.log('\n');
        console.log(colors.magenta(' => No dependency names passed at command line.'));
        console.log(' => Try this instead: "$ suman --install-globals <dep-name0> <dep-name1> <dep-nameX> "');
        return process.exit(1);
    }
    async.mapSeries(deps, function (d, cb) {
        console.log('\n');
        console.log(' => Suman is now installing the following global dep => ', d);
        var k = cp.spawn('bash', [], {
            cwd: p
        });
        k.stdout.pipe(process.stdout);
        k.stderr.pipe(process.stderr);
        k.once('close', function (code) {
            cb(undefined, {
                name: d,
                code: code
            });
        });
        var cmd = "npm install -S " + d + " --only=production";
        k.stdin.write('\n' + cmd + '\n');
        k.stdin.end();
    }, function (err, results) {
        if (err) {
            return console.error(err);
        }
        console.log('\n');
        console.log('=> Suman installation results:');
        console.log('\n');
        var allGood = true;
        results.forEach(function (r) {
            console.log(r);
            if (r.code > 0) {
                allGood = false;
                console.log(' => ', r.name, 'may not have been installed successfully.');
            }
        });
        if (allGood) {
            console.log('\n');
            console.log(' => All deps installed successfully.');
            process.exit(0);
        }
        else {
            console.log('\n');
            console.log(' => Some deps may *not* have been installed successfully.');
            process.exit(1);
        }
    });
};
