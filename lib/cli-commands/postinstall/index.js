'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var _suman = global.__suman = (global.__suman || {});
exports.run = function (opts) {
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
};
