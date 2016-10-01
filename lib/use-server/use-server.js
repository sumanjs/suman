//core
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

//npm
const async = require('async');

/////////////////////////////////////////////////////////////

const installsGroupA = [
  'install',
  'suman-server'
];

module.exports = function useSumanServer (data, cb) {

  console.log('"data" pass to useSumanServer =>', util.inspect(data));

  const root = global.projectRoot;

  console.log(' => Installing suman-server dependency in your local project.');

  if (!global.sumanOpts.force && !process.env.SUDO_UID) {
    console.log('You may wish to run the the commmand with root permissions, since you are installing globally');
    console.log(' => if using "sudo" makes you unhappy, try "# chown -R $(whoami) $(npm root -g) $(npm root) ~/.npm"');
    console.log(' => To override this message, use --force\n');
    return;
  }

  const i = setInterval(function () {
    process.stdout.write('.');
  }, 500);

  async.parallel([
    function (cb) {
      process.nextTick(cb);
    },
    function (cb) {
      const n = cp.spawn('npm', installsGroupA);

      n.on('close', function () {
        cb.apply(null, [ null ].concat(Array.prototype.slice.apply(arguments)));
      });

      n.stderr.setEncoding('utf-8');

      var first = true;

      n.stderr.on('data', function (d) {
        if (first) {
          first = false;
          clearInterval(i);
          console.log('\n');
        }
        console.error(d);
      });
    }
  ], cb);

};