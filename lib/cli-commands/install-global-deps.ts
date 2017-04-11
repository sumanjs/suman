'use strict';

//core
const cp = require('child_process');
const path = require('path');

//npm
const async = require('async');
const colors = require('colors/safe');

//project
const _suman = global.__suman = (global.__suman || {});
const p = path.resolve(process.env.HOME + '/.suman/global');

//////////////////////////////////////////////////////////////////////

export = function (deps: Array<string>): void {

  if (deps.length < 1) {
    console.log('\n');
    console.log(colors.magenta(' => No dependency names passed at command line.'));
    console.log(' => Try this instead: "$ suman --install-globals <dep-name0> <dep-name1> <dep-nameX> "');
    return process.exit(1);
  }

  async.mapSeries(deps, function (d: string, cb: Function) {

    console.log('\n');
    console.log(' => Suman is now installing the following global dep => ', d);

    const k = cp.spawn('bash', [], {
      cwd: p
    });

    k.stdout.pipe(process.stdout);
    k.stderr.pipe(process.stderr);

    k.once('close', function (code: number) {
      cb(undefined, {
        name: d,
        code
      });
    });

    const cmd = `npm install -S ${d} --only=production`;

    k.stdin.write('\n' + cmd + '\n');
    k.stdin.end();

  }, function (err: Error, results: Array<Object>) {

    if (err) {
      return console.error(err);
    }

    console.log('\n');
    console.log('=> Suman installation results:');
    console.log('\n');

    let allGood = true;

    results.forEach(function (r) {
      console.log(r);
      if (r.code > 0) {
        allGood = false;
        console.log(' => ', r.name, 'may not have been installed successfully.');
      }
    });

    if (allGood) {
      console.log('\n');
      console.log(' => All deps installed successfully.');
      process.exit(0);
    }
    else {
      console.log('\n');
      console.log(' => Some deps may *not* have been installed successfully.');
      process.exit(1);
    }

  });

};
