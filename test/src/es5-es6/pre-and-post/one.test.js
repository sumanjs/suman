#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);


//////////////////////////////////////////////////////////////////////////


Test.create(['semver', function (b, assert, describe, before, beforeEach, after, afterEach, it) {

  const semver = b.ioc.semver; // semver
  console.log('semver => ', semver);

  before('adds foo', h => {
    return Promise.resolve('foo').then(function (v) {
      h.assert(v === 'foo');
      h.supply.bar = v;
    });
  });

  it('sync test', t => {
    t.assert.equal(typeof null, 'object');
    t.assert.equal(t.supply.bar, 'foo');
  });

  describe.parallel('nested block', b => {  // constrast this with decribe.series

    beforeEach('runs before each test', h => {
      console.log('test name is now running => ', h.test.desc);
    });

    it('async test 1', async t => {
      let foo = await Promise.resolve(5);
      let bar = foo * await 4;
      t.assert.equal(bar, 20);
    });

    it('async test 2', function* (t) {
      let foo = yield Promise.resolve(5);
      let bar = foo * (yield 4);
      t.assert.equal(bar, 20);
    });

    it.cb('async callback test 3', t => {
      setTimeout(function (err) {
        t.done(err);
      }, 10);
    });

    const makeTest = function (apples) {
      return function (t) {
        t.assert(apples === 'oranges');
        setTimeout(t, 10)
      }
    };

    // in callback mode, t is a function that can be called directly and passed as an error-first callback
    // this was first implemented for backwards-compatibility with Mocha
    it.cb('async callback test 4', makeTest('oranges'));

  });

}]);
