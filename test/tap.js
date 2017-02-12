const parser = require('tap-parser');
const cp = require('child_process');
const path = require('path');

const file = path.resolve(__dirname, 'tap-child.js');
const n = cp.spawn('node', [file]);

n.stdout.setEncoding('utf8');

n.on('error', function (e) {
  console.error(e.stack || e);
});

n.stdout.on('data', function(d){
  console.log('data => ', d);
});

var p = parser(function (results) {
  console.dir(' => results => ',results);
});

const dest = n.stdout.pipe(p);

dest.on('error', function (e) {
  console.error(e.stack || e);
});

dest.on('pass', function () {
  console.log('test passed');
});

dest.on('fail', function () {
  console.log('test failed');
});

dest.on('line', function (line) {
   console.log('line => ', line);
});
