

const cp = require('child_process');
const util = require('util');

const tty = String(cp.execSync('tty', {stdio:['inherit','pipe','pipe']})).trim();

console.log(util.inspect(tty));