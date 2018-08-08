'use strict';

//dts
import {IGlobalSumanObj, ISumanDomain} from "suman-types/dts/global";
import {ITestDataObj} from "suman-types/dts/it";
import {IHookObj} from "suman-types/dts/test-suite";
import {Observable} from 'rxjs';

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
import {makeRunGenerator} from '../helpers/general';

/////////////////////////////////////////////////////////////////////////////////////////

const defaultSuccessEvents = ['success', 'finish', 'close', 'end', 'done'];
const defaultErrorEvents = ['error'];

/////////////////////////////////////////////////////////////////////////////////////////

export const handleReturnVal = function (done: Function, fnStr: string, testOrHook: ITestDataObj | IHookObj) {
  
  return function handle(val: any, warn?: boolean) {
    
    if ((!val || (typeof val.then !== 'function')) && warn) {
      _suman.writeTestError('\n Suman warning: you may have forgotten to return a Promise => \n' + fnStr + '\n');
    }
    
    if (su.isObservable(val)) {
      
      (val as Observable<any>).subscribe(
        function onNext(val: any) {
          _suman.log.info('Observable subscription onNext => ', util.inspect(val));
        },
        function onError(e: any) {
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
      
      val._error = function (e: any) {
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
          process.nextTick(done, e || new Error('Suman dummy error.'));
        }
      };
      
      const eventsSuccess = testOrHook.events && testOrHook.events.success;
      const eventsError = testOrHook.events && testOrHook.events.error;
      
      /*
        options could look like:

        test('example', {
           events: { success: 'done', error: ['error', 'bubba']}
           successEvents: ['foobar'],
           errorEvents: 'fizzbar',
        }, t => {});

      */
      
      const successEvents = su.flattenDeep([testOrHook.successEvents, eventsSuccess, defaultSuccessEvents]);
      successEvents.filter(function (v, i, a) {
        if (v && typeof v !== 'string') {
          _suman.log.error(new Error('Value passed to success events was not a string: ' + util.inspect(v)));
          return false;
        }
        return v && a.indexOf(v) === i;
      })
      .forEach(function (name: string) {
        val.once(name, onSuccess);
      });
      
      const errorEvents = su.flattenDeep([testOrHook.errorEvents, eventsError, defaultErrorEvents]);
      errorEvents.filter(function (v, i, a) {
        if (v && typeof v !== 'string') {
          _suman.log.error(new Error('Value passed to error events was not a string: ' + util.inspect(v)));
          return false;
        }
        return v && a.indexOf(v) === i;
      })
      .forEach(function (name: string) {
        val.once(name, onError);
      });
      
    }
    else {
      // then() callback does not happen in same tick, so needs to be separate call from observables/streams
      // so that we register subscribe() and on() calls in the same tick.
      Promise.resolve(val).then(function () {
          done(null);
        },
        function (err) {
          done(err || new Error('Suman unkwnown error'));
        });
    }
    
  }
};

export const handleGenerator = function (fn: Function, arg: any) {
  const gen = makeRunGenerator(fn, null);
  return gen.call(null, arg);
};




