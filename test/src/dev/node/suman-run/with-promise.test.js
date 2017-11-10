#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);
const su = require('suman-utils');

//////////////////////////////////////////////////////////////////////////

Test.create(['semver', function (b, assert, describe, before, beforeEach, after, afterEach, it) {

  before('adds foo', h => {
    return suman.run({args: ['--default']}).then(function (v) {
      h.$inject.v = v;
    });
  });

  it('sync test', t => {
    t.assert(su.isStream(t.$inject.v.sumanProcess.stdout), 'stdout is not a stream.');
    t.assert(su.isStream(t.$inject.v.sumanProcess.stderr), 'stderr is not defined');
  });

  describe.parallel('par', b => {

    it.parallel('sync test', t => {

      setTimeout(function () {
        t.$inject.v.sumanProcess.stdout.pipe(process.stdout);
        t.$inject.v.sumanProcess.stderr.pipe(process.stderr);
      }, 1000);

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

}]);
