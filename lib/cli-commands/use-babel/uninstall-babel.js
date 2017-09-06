'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const su = require('suman-utils');

//npm
const async = require('async');

//project
const _suman = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////

const installsGroupA = [
  'uninstall',
  '--save',
  '--save-dev',
  'babel-cli',
  'babel-core',
  'babel-loader',
  'babel-polyfill',
  'babel-runtime',
  'babel-register',
  'babel-plugin-transform-runtime',
  'babel-preset-es2015',
  'babel-preset-es2016',
  'babel-preset-react',
  'babel-preset-stage-0',
  'babel-preset-stage-1',
  'babel-preset-stage-2',
  'babel-preset-stage-3'
];

module.exports = function initBabelLocally (data, cb) {

  if (process.env.SUMAN_DEBUG === 'yes') {
    console.log('"data" pass to initBabelLocally =>', util.inspect(data));
  }

  const root = _suman.projectRoot;

  console.log(' => Uninstalling Babel dependencies in your local project.');

  if (!_suman.sumanOpts.force && !process.env.SUDO_UID) {
    console.log('You may wish to run the the commmand with root permissions, since you are installing globally');
    console.log(' => if using "sudo" makes you unhappy, try "# chown -R $(whoami) $(npm root -g) $(npm root) ~/.npm"');
    console.log(' => To override this message, use --force\n');
    return;
  }

  console.log(' => Uninstalling Babel may take awhile, it may be a good time to take a break.');

  const i = setInterval(function () {
    process.stdout.write('.');
  }, 500);

  async.parallel([

    function (cb) {
      const n = cp.spawn('npm', installsGroupA);

      n.on('close', function () {
        clearInterval(i);
        n.kill();
        cb.apply(null, arguments);
      });

      n.stderr.setEncoding('utf-8');

      let first = true;

      n.stderr.on('data', function (d) {
        if (first) {
          first = false;
          clearInterval(i);
          console.log('\n');
        }
        console.error(d);
      });
    }
  ], function (err) {
    if (err) {
      console.error(su.getCleanErrorString(err));
    }
    else {
      console.log(' => Babel successfully uninstalled from your local project.');
    }
  });

};
