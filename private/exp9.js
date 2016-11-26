const cp = require('child_process');
const fs = require('fs');

const fd = fs.openSync('bar.log','a');

const child = cp.spawn('node', [ 'foo.js' ], {
  cwd: __dirname,
  stdio: [ 'ignore', fd, fd ]
});

// using stdio array above I send stdout/stderr to log file
// but I would still like to receive stdout/stderr to this process so I can do something else with it

child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');

child.stdout.on('data', function (d) {
  console.log('stdout => ', d);
});

child.stderr.on('data', function (d) {
  console.log('stderr => ', d);
});