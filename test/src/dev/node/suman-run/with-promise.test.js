#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);
const su = require('suman-utils');

//////////////////////////////////////////////////////////////////////////

Test.create({parallel: true}, ['semver', function (b, assert, describe, before, beforeEach, after, afterEach, it, fs) {

  describe.parallel('use global', b => {

    b.supply.s = 5;

    const getStrm = function () {
      // return process.stdout;
      return fs.createWriteStream('/dev/null', {end: false});
    };

    before(h => {
      return suman.run({
        args: ['--default'],
        useGlobalVersion: true
      })
      .then(function (v) {
        h.supply.v = v;
      });
    });

    before(h => {
      h.supply.v.sumanProcess.stdout.resume();
      h.supply.v.sumanProcess.stderr.resume();
    });

    it('sync test', t => {
      t.assert(su.isStream(t.supply.v.sumanProcess.stdout), 'stdout is not a stream.');
      t.assert(su.isStream(t.supply.v.sumanProcess.stderr), 'stderr is not defined');
      t.supply.v.sumanProcess.x = 5;
    });

    it.cb.parallel('sync test', t => {

      console.log(111111111);

      setTimeout(t.wrapFinal(function () {
        debugger;
        console.log(222222);
        t.supply.v.sumanProcess.stdout.pipe(getStrm());
        t.supply.v.sumanProcess.stderr.pipe(getStrm());

      }), 100);

      // t.supply.v.sumanProcess.stdout.pipe(getStrm());
      // t.supply.v.sumanProcess.stderr.pipe(getStrm());

      // setTimeout(function () {
      //   t.supply.v.sumanProcess.stdout.pipe(getStrm());
      //   t.supply.v.sumanProcess.stderr.pipe(getStrm());
      //   // t.supply.v.sumanProcess.stdout.pause();
      //   // t.supply.v.sumanProcess.stderr.pause();
      // }, 200);

      // t.supply.v.sumanProcess.stdout.resume();
      // t.supply.v.sumanProcess.stderr.resume();
    });

    it.parallel.cb('wait for exit B', t => {
      console.log(333333);
      // t.supply.v.sumanProcess.stdout.once('end', t.pass);
      t.supply.v.sumanProcess.stdout.once('end', function () {
        console.log('the end.');
      });

      t.pass();
    });

  });

  describe.parallel('use local', b => {

    before(h => {
      return suman.run({
        args: ['--default'],
        useLocalVersion: true
      })
      .then(function (v) {
        h.supply.v = v;
      });
    });

    it('sync test', t => {
      t.assert(su.isStream(t.supply.v.sumanProcess.stdout), 'stdout is not a stream.');
      t.assert(su.isStream(t.supply.v.sumanProcess.stderr), 'stderr is not defined');
    });

    it.parallel('sync test A', t => {
      //
      // setTimeout(t.wrapFinalErrFirst(function () {
      //   t.supply.v.sumanProcess.stdout.pipe(getStrm());
      //   t.supply.v.sumanProcess.stderr.pipe(getStrm());
      // }), 100);

      setTimeout(function () {
        t.supply.v.sumanProcess.stdout.pause();
        t.supply.v.sumanProcess.stderr.pause();
      }, 200);

      // t.supply.v.sumanProcess.stdout.resume();
      // t.supply.v.sumanProcess.stderr.resume();
    });

    it.parallel.cb('wait for exit', t => {
      // t.supply.v.sumanProcess.stdout.once('end', t.pass);

      t.supply.v.sumanProcess.stdout.once('end', function () {
        console.log('the end.');
      });

      t.ctn();
    });

  });

}]);
