'use strict';
var cp = require('child_process');
var path = require('path');
var fs = require('fs');
var colors = require('colors/safe');
var _suman = global.__suman = (global.__suman || {});
var script = path.resolve(__dirname + '/../../scripts/suman-postinstall.sh');
console.log('\n');
console.log(' => Suman will run its postinstall routine.');
console.log('\n');
var k = cp.spawn(script);
k.stdout.pipe(process.stdout);
k.stderr.pipe(process.stderr);
k.once('close', function (code) {
    process.exit(code || 0);
});
