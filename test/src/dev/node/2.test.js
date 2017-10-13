#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create('X', {series: true, fixed: true}, function (ƒ, b, assert, describe, before, beforeEach, after, afterEach, it) {

  it('sync test', t => {
    assert(true);
  });

  const x = this;

  debugger;

  before(h => {
    count++;
    h.assert.equal(count, 1);
  });

  b.describe('A', (b, afterEach, after, before, ste) => {

    // console.log('before => ', before);


    b.test('we have a test here', t => {

    });

    assert.equal(count, 0);

    b.before(h => {
      count++;
      h.assert.equal(count, 2);
    });

    it('sync test', t => {
      assert(true);
    });

    after(h => {
      count++;
      h.assert.equal(count, 5);
    });

    describe('C', () => {

      assert.equal(count, 0);

      it('sync test', t => {
        assert(true);
      });

      before(h => {
        count++;
        h.assert.equal(count, 3);
      });

      after(h => {
        count++;
        h.assert.equal(count, 4);
      });

    });

  });

  describe('B', () => {

    assert.equal(count, 0);

    before('zoomy', h => {
      count++;
      h.assert.equal(count, 6);
    });

    it('sync test', t => {
      assert(true);
    });

  });

  after.last('roomy', h => {
    count++;
    h.assert.equal(count, 8);
  });

  after.always('roomy', h => {
    count++;
    h.assert.equal(count, 7);
  });

});
