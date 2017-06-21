import tscmultiwatch from 'tsc-multi-watch';
import * as fs from 'fs';
import * as path from 'path';
import {ISumanOpts} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//project
const _suman = global.__suman = (global.__suman || {});

export const run = function (opts: ISumanOpts) {

  const {projectRoot} = _suman;
  const sumanMultiLock = path.resolve(projectRoot + '/suman.lock');

  fs.writeFile(sumanMultiLock, {flag: 'wx'}, function (err: Error) {

    if (err && !opts.force) {
      _suman.logError('Could not acquire lock. Perhaps another similar process is already running. Use --force to override.');
      return;
    }

    process.once('exit', function () {

      _suman.log('cleaning up sumanMultiLock.');
      try {
        fs.unlinkSync(sumanMultiLock);
      }
      catch (err) {
      }
    });

    const sumanMultiReadyLock = path.resolve(projectRoot + '/suman-watch.lock');

    tscmultiwatch({}, function (err: Error) {

      if (err) {
        console.error(err.stack || err);
        return process.exit(1);
      }

      fs.writeFile(sumanMultiReadyLock, {flag: 'wx'}, function (err: Error) {

        if(err){
          _suman.logError(err.stack || err);
        }
        else{
          _suman.log('successful started multi watch process.');
        }

        let cleanUp = function () {

          console.log('\n');
          _suman.log('cleaning up sumanMultiReadyLock.');

          try {
            fs.unlinkSync(sumanMultiReadyLock);
          }
          catch (err) {
          }

          process.exit(0);

        };

        process.on('SIGINT', cleanUp);
        process.once('exit', cleanUp);
      });


    });


  });


};
