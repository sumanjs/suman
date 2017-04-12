'use strict';

//core
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');
const util = require('util');

//npm
const colors = require('colors/safe');
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});
const su = require('suman-utils');

/////////////////////////////////////////////////////////////////////

module.exports = function (files) {

  const opts = _suman.sumanOpts;
  const coverageDir = path.resolve(_suman.projectRoot + '/coverage');

  const nonJSFiles = [];

  files = files.filter(function (f) {
    if (path.extname(f) === '.js') {
      return true;
    }
    nonJSFiles.push(f);
  });

  console.log('\n');

  if(nonJSFiles.length > 0){
    console.log(colors.magenta.bold(' => Suman warning: The following test files are not .js files, and we cannot use' +
      ' Istanbul to run coverage on them:'));
    nonJSFiles.forEach(function(f, index){
      console.log(index + 1 + ' =>' + colors.magenta(f));
    });
    console.log('\n');
  }

  //TODO: use --include-all-sources
  // as per http://stackoverflow.com/questions/27606071/how-to-make-istanbul-generate-coverage-for-all-of-my-source-code
  //istanbul report --dir coverage --include **/*coverage.json json
  //istanbul report --dir coverage --include **/*coverage.json json


  let istanbulInstallPath;
  let executable;

  try {
    istanbulInstallPath = require.resolve('istanbul');
    executable = path.resolve(istanbulInstallPath + '/../../.bin/istanbul');
    // using readlink will find the symlink location => e.g. .../node_modules/istanbul/lib/cli.js
    executable = String(cp.execSync('readlink -f ' + executable)).trim();
    if (opts.verbose) {
      console.log(' => Suman verbose message => install path of instabul => ', istanbulInstallPath);
    }
  }
  catch (e) {

    executable = String(cp.execSync('which istanbul')).trim();

    if (!executable) {
      console.log('\n', ' => Suman message => Looks like "istanbul" is not installed on your system, ' +
        'you can run "$ suman --use-istanbul", to acquire the right deps.');
      console.log('\n', ' => Suman message => If installing "istanbul" manually, you may install locally or globally, ' +
        'Suman will pick it up either way.');
      return process.exit(1);
    }

    console.log(' => Istanbul executable path => ' + executable);
    executable = 'istanbul';
  }

  console.log(' => Resolved stanbul executable => ' + executable);

  const bash = [];

  if (!_suman.sumanOpts.sparse) {
    console.log(' => Suman verbose message => Files to be covered by istanbul:');
    let noFiles = true;
    files.forEach(function (f, i) {
      noFiles = false;
      console.log('\t', i + 1, ' => ' + f);
    });
    if (noFiles) {
      console.log('\t\t(in fact, no files will be covered by istanbul, we are done here.)');
      return;
    }
  }

  su.removeSharedRootPath(files).forEach(function (file) {

    if (String(file[1]).endsWith('.js')) {
      file[1] = String(file[1]).substring(0, String(file[1]).length - 3);
    }

    if (os.platform() === 'win32') {
        throw new Error(' => Suman => Windows support is not available.');
    }
    else {
      const tempConverageDir = path.resolve(coverageDir + '/' + String(file[1]).replace(/\//g, '-'));
      bash.push(['cover', file[0], '--dir', tempConverageDir, '--report', 'lcov']);
    }

  });

  //TODO: turn this into spawn instead of exec?

  async.parallel({

    runner: function (cb) {

      if (!_suman.sumanOpts.library_coverage) {
        return process.nextTick(cb);
      }
      const cmd = './node_modules/.bin/suman --concurrency=3 --cwd-is-root --library-coverage --runner ' + files.join(' ');

      const argz = String(cmd).split(/\s+/);

      if (process.env.SUMAN_DEBUG === 'yes') {
        console.log(' => Suman coverage command =>\n' + colors.magenta(argz.map(i => '\n' + i)));
      }

      const n = cp.spawn('node', argz, {});

      n.stdout.setEncoding('utf8');
      n.stderr.setEncoding('utf8');
      n.stdout.pipe(process.stdout);
      n.stderr.pipe(process.stderr);

      n.once('close', function (code) {
        n.unref();
        cb(null, code);
      });

    },

    individual: function (cb) {

      if (os.platform() === 'win32') {
        console.error(' => Suman warning => Windows not implemented yet.');
        return process.nextTick(cb);
      }

      async.mapLimit(bash, 5, function (item, cb) {

        // console.log('item => ', item);
        const n = cp.spawn(executable, item, {});

        n.stdout.setEncoding('utf8');
        n.stderr.setEncoding('utf8');

        n.stdout.pipe(process.stdout);
        n.stderr.pipe(process.stderr);

        n.once('close', function (code) {
          n.unref();
          cb(null, code);
        });

      }, function (err, results) {
        if (err) {
          console.error(err.stack || err);
        }
        console.log('results => ', results);
        cb(null);
      });

    }

  }, function (err, results) {

    if (err) {
      console.error(err.stack || err);
    }

    const k = cp.spawn(executable, ['report', '--dir', coverageDir,'--include', '**/*coverage.json', 'lcov'], {
      cwd: _suman.projectRoot
    });

    k.stdout.pipe(process.stdout);
    k.stderr.pipe(process.stderr);

    k.once('close', function (code) {
      k.unref();

      if (code > 0) {
        process.exit(1);
      }
      else {
        process.exit(0);
      }
    });

  });

};
