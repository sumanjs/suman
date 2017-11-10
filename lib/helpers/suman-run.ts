'use strict';

//dts
import {ChildProcess} from "child_process";
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');
import cp = require('child_process');

//npm
import su = require('suman-utils');

/////////////////////////////////////////////////////////////////////////////////

export interface ISumanRunOptions {
  env?: Object,
  useGlobalVersion?: boolean,
  useLocalVersion?: boolean,
  args: Array<string>

}

export interface ISumanRunRet {
  sumanProcess: ChildProcess,

}

type FunctionErrHanlder = (reason: any, v: ISumanRunRet) => PromiseLike<never>;

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});

/////////////////////////////////////////////////////////////////////////////////

export interface ISumanRunFn {
  (runOptions: ISumanRunOptions): Promise<ISumanRunRet>
  cb?: (runOptions: ISumanRunOptions, cb: Function) => void;
}

export const run = function (): ISumanRunFn {

  return function runSumanWithPromise(runOptions: ISumanRunOptions): Promise<ISumanRunRet> {

    if (runOptions.useGlobalVersion && runOptions.useLocalVersion) {
      throw new Error('Suman run routine cannot use both local and global versions -> check your options object passed to suman.run()');
    }

    if (!Array.isArray(runOptions.args)) {
      throw new Error('"args" property must be an array.');
    }

    if (runOptions.args.length < 1) {
      throw new Error('You must pass at least one argument to the suman executable, try "--" or "--default", if nothing else.');
    }

    if (runOptions.env && su.isObject(runOptions.env)) {
      throw new Error('"env" property must be a plain object.');
    }

    let executable, args = runOptions.args, env = runOptions.env || {};

    if (runOptions.useGlobalVersion) {
      executable = 'suman';
    }
    else if (runOptions.useLocalVersion) {
      executable = path.resolve(_suman.projectRoot + '/node_modules/.bin/suman');
    }
    else {
      executable = 'suman';
    }

    return new Promise(function (resolve, reject) {

      const k = cp.spawn('suman', args, {
        env: Object.assign({}, process.env, env),
      });

      k.stdout.pause();
      k.stderr.pause();

      k.once('error', function (err: Error) {
        _suman.log.error('Suman run spawn error:', err.stack || err);
        reject(err);
      });

      setImmediate(function () {
        resolve({
          sumanProcess: k
        });
      });

    });

  };

};

export const setupRunCb = function (runSumanWithPromise: Function) {
  runSumanWithPromise.cb = function runSumanWithCallback(runOptions: ISumanRunOptions, cb: Function) {
    runSumanWithPromise(runOptions).then(function (val: ISumanRunRet) {
      cb(null, val);
    }, cb);
  }
};

