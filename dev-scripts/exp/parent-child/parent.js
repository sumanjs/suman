

const cp = require('child_process');
const path = require('path');


const k = cp.spawn('bash');
const c = path.resolve(__dirname + '/child.js');

k.stdin.end(`\n NODE_OPTIONS="--require('path')" node ${c} \n`);

k.stdout.pipe(process.stdout);
