'use strict';
import {IGlobalSumanObj, IPseudoError, ISumanDomain} from "../../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const makeGen = require('../helpers/async-gen');

/////////////////////////////////////////////////////////////////////////////////////////

export const handlePotentialPromise = function (done: Function, str: string) {

  return function handle(val: any, warn: boolean, d: ISumanDomain) {

    if ((!val || (typeof val.then !== 'function')) && warn) {
      _suman.writeTestError('\n Suman warning: you may have forgotten to return a Promise => \n' + str + '\n');
    }

    if (su.isObservable(val)) {

      val.subscribe(
        function onNext(val: any) {
          console.log(' => Suman Observable subscription onNext => ', util.inspect(val));
        },
        function onError(e: IPseudoError) {
          //TODO: we assume we are unsubscribed automatically if onError is fired
          done(e || new Error('Suman dummy error.'));
        },
        function onCompleted() {
          //TODO: we assume we are unsubscribed automatically if onCompleted is fired
          done();
        });

    }
    else if (su.isSubscriber(val)) {

      const _next = val._next;
      const _error = val._error;
      const _complete = val._complete;

      val._next = function () {
        _next.apply(val, arguments);
      };

      val._error = function (e: IPseudoError) {
        _error.apply(val, arguments);
        done(e || new Error('Suman dummy error.'));
      };

      val._complete = function () {
        _complete.apply(val, arguments);
        done();
      }

    }
    else if (su.isStream(val)) {

      let success = function () {
        // happens in nextTick so that if error occurs, error has a chance to sneak in
        process.nextTick(done)
      };

      val.once('end', success);
      val.once('close', success);
      val.once('done', success);
      val.once('finish', success);
      val.once('error', function (e: IPseudoError) {
        done(e || new Error('Suman dummy error.'));
      });

    }
    else {
      // then() callback does not happen in same tick, so needs to be separate call from observables/streams
      // so that we register subscribe() and on() calls in the same tick.
      Promise.resolve(val).then(function () {
        done(null);
      }, done);
    }

  }
};

export const makeHandleGenerator = function (done: Function) {

  return function (fn: Function, args: Array<any>, ctx: Object) {
    const gen = makeGen(fn, ctx);
    gen.apply(ctx, args).then(function (val: any) {
      done(null, val);
    }, done);

  }
};

///////////// support node style imports //////////////////////////////////////////////////

let $exports = module.exports;
export default $exports;

//////////////////////////////////////////////////////////////////////////////////////////


