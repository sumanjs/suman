#!/usr/bin/env node

console.log(' => Suman postinstall script succeeded after', Number(process.env['SUMAN_TOTAL_TIME'])/1000, 'seconds.');
console.log('\n');
const debugPostinstall = require('suman-debug')('s:postinstall');
debugPostinstall(' => Suman post-install script succeeded');

