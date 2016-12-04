
const fs = require('fs');
const path = require('path');

console.log(' => Suman postinstall script succeeded.');

const sumanDebugLog = path.resolve(process.env.HOME + '/.suman/suman-debug.log');
fs.writeFileSync(sumanDebugLog, '\n => Suman post-install script succeeded', {flag: 'a'});
