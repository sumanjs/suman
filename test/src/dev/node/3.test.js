#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {}, {
  allowSkip: true
}, {
  allowSkip: true
});

///////////////////////////////////////////////////////////////////////

Test.create({delay: true}, b => {
  b.resume();
});

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it, $core) {

  const {child_process, http} = $core;

  beforeEach.define('early').run(h => {
    return Promise.resolve('foobar');
  });

  describe.skip('foo');

  describe('here we go', function (b) {

    before(h => {
      h.assert(true);
    });

    it('sync test', t => {
      t.assert(true);
    });

    after(h => {
      assert(true);
    });

    describe('here we go', function (b) {

      before(h => {
        assert(true);
      });

      it('sync test', t => {
        assert(true);
      });

      after(h => {
        assert(true);
      });

      describe('here we go', function (b) {

        before(h => {
          assert(true);
        });

        it('sync test', t => {
          assert(true);
        });

        after(h => {
          assert(true);
        });

        describe('here we go', function (b) {

          before(h => {
            assert(true);
          });

          it('sync test', t => {
            assert(true);
          });

          after(h => {
            assert(true);
          });

        });

      });

      describe('here we go', function (b) {

        before(h => {
          assert(true);
        });

        it('sync test', t => {
          assert(true);
        });

        after(h => {
          assert(true);
        });

      });

    });

    describe('here we go', function (b) {

      before(h => {
        assert(true);
      });

      it('sync test', t => {
        assert(true);
      });

      after(h => {
        assert(true);
      });

    });

  });

});
