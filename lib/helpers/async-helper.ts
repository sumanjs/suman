'use strict';

//dts
import {IPseudoError} from "suman-types/dts/global";
import Timer = NodeJS.Timer;

//core
import util = require('util');

//npm
import su = require('suman-utils');
const fnArgs = require('function-arguments');

//project
import {makeRunGenerator} from './async-gen';

///////////////////////////////////////////////////////////////////////////////////////

export const asyncHelper =
  function (key: string, resolve: Function, reject: Function, $args: Array<any>, ln: number, fn: Function) {

    // ln is length of function arguments before callback argument
    if (typeof fn !== 'function') {
      let e = new Error('Suman usage error: would-be function was undefined or otherwise not a function =>\n' + String(fn));
      reject({key, error: e});
    }
    else if (fn.length > 1 && su.isGeneratorFn(fn)) {
      let e = new Error('Suman usage error: function was a generator function but also took a callback =>\n' + String(fn));
      reject({key, error: e});
    }
    else if (su.isGeneratorFn(fn)) {
      const gen = makeRunGenerator(fn, null);
      gen.apply(null, $args).then(resolve, function (e: Error | string) {
        reject({key: key, error: e});
      });
    }
    else if (fn.length > 1) {
      let args = fnArgs(fn);
      let str = fn.toString();
      let matches = str.match(new RegExp(args[1], 'g')) || [];
      if (matches.length < 2) {
        // there should be at least two instances of the 'cb' string in the function,
        // one in the parameters array, the other in the fn body.
        let e = new Error('Suman usage error => Callback in your function was not present => ' + str);
        return reject({key: key, error: e});
      }

      $args.push(function (e: IPseudoError | string, val: any) {
        e ? reject({key: key, error: e}) : resolve(val)
      });

      fn.apply(null, $args);
    }
    else {
      Promise.resolve(fn.apply(null, $args))
      .then(resolve, function (e: IPseudoError | string) {
        reject({key: key, error: e});
      });
    }

  };
