
const suman = require('suman');

 suman.run({
  // args: ['--default'],
   args: ['test/src/dev/node/3.test.js'],
   useGlobalVersion: true
})
.then(function (v) {

  v.sumanProcess.stdout.pipe(process.stdout);
});
