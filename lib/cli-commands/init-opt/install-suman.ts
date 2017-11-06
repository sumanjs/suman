'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const cp = require('child_process');
const os = require('os');

//npm
import * as chalk from 'chalk';

const chmodr = require('chmodr');

//project
const _suman = global.__suman = (global.__suman || {});
const {constants} = require('../../../config/suman-constants');
import su = require('suman-utils');
const debug = require('suman-debug')('s:init');

/////////////////////////////////////////////////////////////////////////////

export const runNPMInstallSuman = function (resolvedLocal: boolean, pkgDotJSON: Object, projectRoot: string) {

  return function npmInstall(cb: Function) {

    if (_suman.sumanOpts.no_install || resolvedLocal) {
      if (resolvedLocal) {
        console.log('\n\n');
        _suman.log.info(chalk.magenta('Suman is already installed locally ( v' + pkgDotJSON.version + '),' +
          ' to install to the latest version on your own, use =>', '\n',
          ' "$ npm install -D suman@latest"'));
      }
      process.nextTick(cb);
    }
    else {

      _suman.log.info('Installing suman locally...using "npm install -D suman"...');
      const sumanUrl = process.env.SUMAN_META_TEST === 'yes' ? 'github:sumanjs/suman#dev' : 'suman@latest';

      const s = cp.spawn('npm', ['install', '--production', '--only=production', '--loglevel=warn', '-D', sumanUrl], {
        cwd: projectRoot,
        env: Object.assign({}, process.env, {
          SUMAN_POSTINSTALL_IS_DAEMON: _suman.sumanOpts.daemon ? 'yes' : undefined
        })
      });

      s.stdout.setEncoding('utf8');
      s.stderr.setEncoding('utf8');

      let i = setInterval(function () {
        process.stdout.write('.');
      }, 500);

      s.stdout.on('data', (d: string) => {
        console.log(d);
      });

      let first = true;
      s.stderr.on('data', (d: string) => {
        if (first) {
          first = false;
          clearInterval(i);
          console.log('\n\n');
        }
        console.error(String(d));
      });

      s.on('exit', (code: number) => {
        clearInterval(i);
        console.log('\n');
        console.error('\n');
        if (code > 0) {  //explicit for your pleasure
          cb(null, ' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.')
        }
        else {
          cb(null);
        }
      });
    }

  }

};
