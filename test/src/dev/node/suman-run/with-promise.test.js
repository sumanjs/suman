#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);
const su = require('suman-utils');

//////////////////////////////////////////////////////////////////////////

Test.create({parallel: true}, ['semver', function (b, assert, describe, before, beforeEach, after, afterEach, it, fs) {

  it('is spectacular1', t => {

  });

  it('is spectacular2', t => {

  });

  it('is spectacular3', t => {

  });

  describe.parallel('use global', b => {

    b.$inject.s = 5;

    const getStrm = function(){
      return fs.createWriteStream('/dev/null', {end: false});
    };

    before(h => {
      return suman.run({
        args: ['--default'],
        useGlobalVersion: true
      })
      .then(function (v) {
        h.$inject.v = v;
      });
    });

    it('sync test', t => {
      t.assert(su.isStream(t.$inject.v.sumanProcess.stdout), 'stdout is not a stream.');
      t.assert(su.isStream(t.$inject.v.sumanProcess.stderr), 'stderr is not defined');
      t.$inject.v.sumanProcess.x = 5;
    });

    it.cb.parallel('sync test', t => {

      setTimeout(t.final(function () {
        t.$inject.v.sumanProcess.stdout.pipe(getStrm());
        t.$inject.v.sumanProcess.stderr.pipe(getStrm());
      }), 100);

      // setTimeout(function () {
      //   t.$inject.v.sumanProcess.stdout.pause();
      //   t.$inject.v.sumanProcess.stderr.pause();
      // }, 200);

      // t.$inject.v.sumanProcess.stdout.resume();
      // t.$inject.v.sumanProcess.stderr.resume();
    });

    it.parallel.cb('wait for exit', t => {
      t.$inject.v.sumanProcess.stdout.once('finish', t.pass);
    });

  });

  describe.parallel('use local', b => {

    describe('inner', b => {

      it('is great', t => {

      });

    });

    before(h => {
      return suman.run({
        args: ['--default'],
        useLocalVersion: true
      })
      .then(function (v) {
        h.$inject.v = v;
      });
    });

    it('sync test', t => {
      t.assert(su.isStream(t.$inject.v.sumanProcess.stdout), 'stdout is not a stream.');
      t.assert(su.isStream(t.$inject.v.sumanProcess.stderr), 'stderr is not defined');
    });

    it.parallel('sync test', t => {

      setTimeout(t.finalErrFirst(function () {
        t.$inject.v.sumanProcess.stdout.pipe(getStrm());
        t.$inject.v.sumanProcess.stderr.pipe(getStrm());
      }), 100);

      // setTimeout(function () {
      //   t.$inject.v.sumanProcess.stdout.pause();
      //   t.$inject.v.sumanProcess.stderr.pause();
      // }, 200);

      // t.$inject.v.sumanProcess.stdout.resume();
      // t.$inject.v.sumanProcess.stderr.resume();
    });

    it.parallel.cb('wait for exit', t => {
      t.$inject.v.sumanProcess.stdout.once('finish', t.pass);
    });

  });


  it('is groovy 1', t => {

  });

  it('is groovy 2', t => {

  });

  it('is groovy 3', t => {

  });

}]);