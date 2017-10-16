'use strict';
import {IGlobalSumanObj, IPseudoError, ISumanDomain} from "suman-types/dts/global";
import {ITestDataObj} from "suman-types/dts/it";
import {IHookObj} from "suman-types/dts/test-suite";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');

//npm
import _ = require('lodash');
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const makeGen = require('../helpers/async-gen');

/////////////////////////////////////////////////////////////////////////////////////////

const defaultSuccessEvents = ['success', 'finish', 'close', 'end', 'done'];
const defaultErrorEvents = ['error'];

/////////////////////////////////////////////////////////////////////////////////////////

export const handleReturnVal = function (done: Function, str: string, testOrHook: ITestDataObj | IHookObj) {

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
    else if (su.isStream(val) || su.isEventEmitter(val)) {

      let first = true;

      let onSuccess = function () {
        // happens in nextTick so that if error occurs, error has a chance to sneak in
        if (first) {
          first = false;
          process.nextTick(done);
        }
      };

      let onError = function (e: Error) {
        // happens in nextTick so that if error occurs, error has a chance to sneak in
        if (first) {
          first = false;
          process.nextTick(function () {
            done(e || new Error('Suman dummy error.'));
          });
        }
      };

      const successEvents = _.union(defaultSuccessEvents, _.flattenDeep([testOrHook.successEvents]));
      successEvents.forEach(function (name: string) {
        val.once(name, onSuccess);
      });

      const errorEvents = _.union(defaultErrorEvents, _.flattenDeep([testOrHook.errorEvents]));
      errorEvents.forEach(function (name: string) {
        val.once(name, onError);
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

export const handleGenerator = function (fn: Function, args: Array<any>) {
  const gen = makeGen(fn, null);
  return gen.apply(null, args);
};




