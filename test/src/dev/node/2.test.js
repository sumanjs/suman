#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);
const Promise = require('bluebird');

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create('X', {
  series: true,
  fixed: true
}, (s, b, assert, describe, before, beforeEach, after, afterEach, it, afterAll, afterall) => {


  const x = this;

  debugger;

  it('sync test', t => {
    assert(true);
  });

  before(h => {
    h.assert.equal(++count, 1);
  });

  describe('xx', b => {

  });

  1..times(function () {

    describe('A', (b, afterEach, after, before, test) => {

      // console.log('before => ', before);

      test('we have a test here', t => {

      });

      assert.equal(count, 0);

      before(async function (h) {
        h.assert.equal(++count, 2);
        return Promise.delay(399).then(function () {
          console.log('delaying more.');
          return Promise.delay(1000);
        });
      });

      it('sync test', t => {
        assert(true);
      });

      after(h => {
        h.assert.equal(++count, 5);
      });

      describe('C', ß => {

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

  });

  describe('B', () => {

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

  afterAll.always('roomy', h => {
    h.assert.equal(++count, 7);
  });

});
