#!/usr/bin/env node

console.log(' => Suman postinstall script succeeded after', process.env.TOTAL_TIME, 'seconds.', '\n');
const debugPostinstall = require('suman-debug')('s:postinstall');
debugPostinstall(' => Suman post-install script succeeded');

