#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module, {
  forceParallel: true  // parallel, not parallel-max
});

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it) {

  before(h => {
    h.assert.equal(++count, 1);
  });

  it.cb('sync test', t => {
    t.assert.equal(++count, 2);
    t.done()
  });

  after.cb(h => {
    h.assert.equal(++count, 26);
    h.ctn();
  });

  describe('here we go', function () {

    before(h => {
      h.assert.equal(++count, 3);
    });

    it.cb('sync test', t => {
      t.assert.equal(++count, 4);
      t.done()
    });

    after.cb(h => {
      h.assert.equal(++count, 25);
      h.ctn();
    });

    describe('here we go', function () {

      before(h => {
        h.assert.equal(++count, 5);
      });

      it('sync test', t => {
        t.assert.equal(++count, 6);
      });

      after(h => {
        h.assert.equal(++count, 19);
      });

      describe('here we go', function () {

        before(h => {
          h.assert.equal(++count, 7);
        });

        it('sync test', t => {
          t.assert.equal(++count, 8);
        });

        after.cb(h => {
          h.assert.equal(++count, 13);
          h.ctn();
        });

        after(h => {
          h.assert.equal(++count, 14);
        });

        describe('here we go', function () {

          before(h => {
            h.assert.equal(++count, 9);
          });

          it('sync test', t => {
            t.assert.equal(++count, 10);
          });

          after.cb(h => {
            h.assert.equal(++count, 11);
            h.ctn();
          });

          after(h => {
            h.assert.equal(++count, 12);
          });

        });

      });

      describe('here we go', function () {

        before(h => {
          h.assert.equal(++count, 15);
        });

        after.cb(h => {
          h.assert.equal(++count, 17);
          h.ctn();
        });

        it('sync test', t => {
          t.assert.equal(++count, 16);
        });

        after(h => {
          h.assert.equal(++count, 18);
        });

      });

    });

    describe('here we go', function () {

      before(h => {
        h.assert.equal(++count, 20);
      });

      after.cb(h => {
        h.assert.equal(++count, 23);
        h.ctn();
      });

      it('sync test', t => {
        t.assert.equal(++count, 21);
      });

      it.cb('sync test', t => {
        t.assert.equal(++count, 22);
        t.done();
      });

      after(h => {
        h.assert.equal(++count, 24);
      });

    });

  });

});
