#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module, {}, {
  // series: false
});

///////////////////////////////////////////////////////////////////////

let count = 0;

const opts = {
  series: true,
  fixed: true
};

Test.create(opts, [function (assert, describe, before, beforeEach, after, afterEach, it) {

  it('sync test hagieao agoeajgoea jo joeajgoea  aegjeag oa iag j aogeg ', t => {
    assert(false);
  });

  it.skip['retries:5, name:hi']('zoom', t => {

  });

  before('hi', [h => {
    h.assert.equal(++count, 1);
  }]);

  describe('nested1', {}, b => {

    b.set('a', true);

    // console.log('before => ', before);
    assert.equal(count, 0);

    before(h => {
      h.assert(h.get('a'));
      h.assert.equal(++count, 2);
    });

    it('sync test', t => {
      assert(true);
    });

    after(h => {
      h.assert.equal(++count, 5);
    });

    describe('nested2', {}, b => {

      assert(b.get('a'));

      assert.equal(count, 0);

      it('sync test', t => {
        assert(true);
      });

      before(h => {
        h.assert.equal(++count, 3);
      });

      after(h => {
        h.assert.equal(++count, 4);
      });

    });

  });

  describe('nested3', () => {

    assert.equal(count, 0);

    before('zoomy', h => {
      h.assert.equal(++count, 6);
    });

    it('sync test', t => {
      assert(true);
    });

  });

  after.last('roomy', h => {
    h.assert.equal(++count, 8);
  });

  after.always('roomy', h => {
    h.assert.equal(++count, 7);
  });

}]);
