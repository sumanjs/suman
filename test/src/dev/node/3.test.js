#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it) {

  describe('here we go', function () {

    before(h => {
      assert(true);
    });

    it('sync test', t => {
      assert(true);
    });

    after(h => {
      assert(true);
    });

    describe('here we go', function () {

      before(h => {
        assert(true);
      });

      it('sync test', t => {
        assert(true);
      });

      after(h => {
        assert(true);
      });

      describe('here we go', function () {

        before(h => {
          assert(true);
        });

        it('sync test', t => {
          assert(true);
        });

        after(h => {
          assert(true);
        });

        describe('here we go', function () {

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

      describe('here we go', function () {

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

    describe('here we go', function () {

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
