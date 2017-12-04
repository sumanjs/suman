

const cp = require('child_process');
const path = require('path');
const JSONStdio = require('json-stdio');


const k = cp.spawn('bash');
const c = path.resolve(__dirname + '/echo-env.js');

k.stdin.end(`\n NODE_OPTIONS=--zoom="zim zam" node ${c} \n`);

const strm = k.stdout.pipe(JSONStdio.createParser());

strm.on(JSONStdio.stdEventName, function (data) {
  console.log('env => ', data.env);
});

// k.stdout.pipe(process.stdout);

k.once('exit', function (code) {
  console.log('exited with code => ', code);
});
