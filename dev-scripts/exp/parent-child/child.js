


const cp = require('child_process');
const path = require('path');


const k = cp.spawn('bash');
const c = path.resolve(__dirname + '/grandchild.js');

k.stdin.end(`\n node ${c} \n`);

k.stdout.pipe(process.stdout);
