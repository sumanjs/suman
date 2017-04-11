'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
const util = require('util');

//npm
const su = require('suman-utils');

//project
const _suman = global.__suman = (global.__suman || {});
const makeGen = require('../helpers/async-gen');

/////////////////////////////////////////////////////////////////////////////////////////

module.exports = {


  handlePotentialPromise: function handlePotentialPromise(done, str) {

    return function handle(val, warn) {

      if ((!val || (typeof val.then !== 'function')) && warn) {
        _suman._writeTestError('\n => Suman warning: you may have forgotten to return a Promise => \n' + str + '\n');
      }

      if (su.isObservable(val)) {

        val.subscribe(
          function onNext(val) {
            console.log(' => Suman Observable subscription onNext => ', util.inspect(val));
          },
          function onError(e) {
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

        val._error = function (e) {
          _error.apply(val, arguments);
          done(e || new Error('Suman dummy error.'));
        };

        val._complete = function () {
          _complete.apply(val, arguments);
          done();
        }

      }
      else if (su.isStream(val)) {

        val.once('end', success);
        val.once('close', success);
        val.once('done', success);
        val.once('finish', success);
        val.once('error', function (e) {
          done(e || new Error('Suman dummy error.'));
        });

        function success() {
          // happens in nextTick so that if error occurs, error has a chance to sneak in
          process.nextTick(done)
        }

      }
      else {
        // then() callback does not happen in same tick, so needs to be separate call from observables/streams
        // so that we register subscribe() and on() calls in the same tick.
        Promise.resolve(val).then(function () {
          done(null);
        }, done);
      }

    }
  },

  makeHandleGenerator: function makeHandleGenerator(done) {

    return function (fn, args, ctx) {
      const gen = makeGen(fn, ctx);
      gen.apply(ctx, args).then(function (val) {
        done(null, val);
      }, done);

    }
  }

};
