#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////////////////////////////////

let count = 0;
const opts = {series: true, fixed: true};


Test.create(opts, function (assert, describe, before, beforeEach, after, afterEach, it) {

  before(h => {
    count++;
    h.assert.equal(count, 1);
  });

  it('sync test', t => {
    assert(true);
  });

  describe('nested1', () => {

    // console.log('before => ', before);

    assert.equal(count, 0);

    before(h => {
      count++;
      h.assert.equal(count, 2);
    });

    after(h => {
      count++;
      h.assert.equal(count, 6);
    });

    describe('nested2', () => {

      assert.equal(count, 0);

      before(h => {
        count++;
        h.assert.equal(count, 3);
      });

      after(h => {
        count++;
        h.assert.equal(count, 5);
      });

    });

  });

  describe('nested3', () => {

    assert.equal(count, 0);

    before('zoomy', h => {
      count++;
      h.assert.equal(count, 4);
    });

  });

  after.last('roomy', h => {
    count++;
    h.assert.equal(count, 8);
  });

  after('roomy', h => {
    count++;
    h.assert.equal(count, 7);
  });

});
