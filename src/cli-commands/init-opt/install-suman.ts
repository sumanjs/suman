'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const os = require('os');

//npm
import chalk from 'chalk';
import su = require('suman-utils');
const chmodr = require('chmodr');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../config/suman-constants');

/////////////////////////////////////////////////////////////////////////////

export const makeNPMInstall = function (resolvedLocal: boolean, pkgDotJSON: Object, projectRoot: string) {

  return function npmInstall(cb: Function) {

    const sumanOpts = _suman.sumanOpts;

    if (!sumanOpts.install || sumanOpts.no_install || resolvedLocal) {
      if (resolvedLocal) {
        console.log('\n');
        _suman.log.info(chalk.magenta.bold(`Suman is already installed locally ( v${pkgDotJSON.version} ).\n` +
          `To install to the latest version on your own, use => '$ npm install -D suman@latest'`));
        console.log('\n');
      }

      return process.nextTick(cb);
    }

    const sumanUrl = process.env.SUMAN_META_TEST === 'yes' ? 'github:sumanjs/suman#dev' : 'suman@latest';
    const installOptsArray = ['install', '--production', '--only=production', '--loglevel=warn', '-D', sumanUrl];
    _suman.log.info(`Installing suman locally...using "npm ${installOptsArray.join(' ')}"...`);
    console.log('\n');

    const s = cp.spawn('npm', installOptsArray, {
      cwd: projectRoot,
      env: Object.assign({}, process.env, {
        SUMAN_INIT_ROUTINE_NPM_INSTALL: 'yes'
      })
    });

    s.stdout.setEncoding('utf8');
    s.stderr.setEncoding('utf8');

    let i = setInterval(function () {
      process.stdout.write('.');
    }, 500);

    s.stdout.once('data', (d: string) => {
      _suman.log.info(d);
      clearInterval(i);
    });

    let first = true;
    s.stderr.on('data', (d: string) => {
      if (first) {
        first = false;
        clearInterval(i);
        _suman.log.info('\n\n');
      }
      _suman.log.warning(String(d));
    });

    s.once('exit', (code: number) => {
      clearInterval(i);
      _suman.log.info('\n');
      if (code > 0) {
        _suman.log.error(' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.');
      }

      cb(null);

    });

  }

};
