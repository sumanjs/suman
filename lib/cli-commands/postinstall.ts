'use strict';

//core
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

//npm
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const script = path.resolve(__dirname + '/../../scripts/suman-postinstall.sh');

//////////////////////////////////////////////////////////////////////


console.log('\n');
console.log(' => Suman will run its postinstall routine.');
console.log('\n');

const k = cp.spawn(script);

k.stdout.pipe(process.stdout);
k.stderr.pipe(process.stderr);

k.once('close', function (code: number) {
    process.exit(code || 0);
});






