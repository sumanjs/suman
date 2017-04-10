//open -a Firefox 'http://www.youtube.com/'

const cp = require('child_process');
const k = cp.spawn('open', ['-a', 'Firefox', 'http://localhost:3050/#!/home']);

k.on('error', function (e) {
  console.error(' => Error => ', e.stack || e);
});

k.stdout.setEncoding('utf8');
k.stderr.setEncoding('utf8');

k.stderr.on('data', function (d) {
  console.log('stderr => ', d);
});

k.stdout.on('data', function (d) {
  console.log('=> stdout => ', d);
});
