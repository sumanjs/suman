#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);
const su = require('suman-utils');

//////////////////////////////////////////////////////////////////////////

Test.create(['semver', function (b, assert, describe, before, beforeEach, after, afterEach, it) {

  before.cb('adds foo', h => {
     suman.run.cb({args: ['--default']}, function (err, v) {
      h.supply.v = v;
      h.done(err);
    });
  });

  it('sync test', t => {
    t.assert(su.isStream(t.supply.v.sumanProcess.stdout), 'stdout is not a stream.');
    t.assert(su.isStream(t.supply.v.sumanProcess.stderr), 'stderr is not defined');
  });

  describe.parallel('par', b => {

    it.parallel('sync test', t => {

      setTimeout(function () {
        t.supply.v.sumanProcess.stdout.pipe(process.stdout);
        t.supply.v.sumanProcess.stderr.pipe(process.stderr);
      }, 1000);

      // setTimeout(function () {
      //   t.supply.v.sumanProcess.stdout.pause();
      //   t.supply.v.sumanProcess.stderr.pause();
      // }, 200);

      // t.supply.v.sumanProcess.stdout.resume();
      // t.supply.v.sumanProcess.stderr.resume();
    });

    it.parallel.cb('wait for exit', t => {
      t.supply.v.sumanProcess.stdout.once('finish', t.pass);
    });

  });

}]);
