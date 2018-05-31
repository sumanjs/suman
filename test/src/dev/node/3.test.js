#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {
    pre: ['dog']
  },
  {
    allowSkip: true
  });

let count = 0;

///////////////////////////////////////////////////////////////////////

// Test.create({delay: true}, b => {
//   b.resume();
// });


Test.create(function (b, assert, describe, test, before, beforeEach, after, afterEach, it, $core) {

  const {child_process, http} = $core;

  beforeEach.define('early').run(h => {
    return Promise.resolve('foobar');
  });


  b.set('a', 'bingo');
  const [a, z] = b.getValues('a', 'b');
  assert.equal(a, 'bingo');
  assert.equal(z, undefined);

  describe.skip('foo');

  describe('here we go', function (b) {

    const [a, z] = b.getValues('a', 'b');
    assert.equal(a, 'bingo');
    assert.equal(z, undefined);

    before(h => {
      h.assert(true);
    });

    // it('sync test', t => {
    //   t.assert(true);
    //   t.plan(3);
    //   t.confirm();
    //   t.confirm();
    // });


    after.fatal(h => {
      h.plan(3);
      h.confirm();
      h.confirm();
      h.confirm();
      assert(true);
    });

    describe('here we go', function (b) {

      before(h => {
        assert(true);
      });

      test.define('sync test').run(t => {
        t.assert(true);
      });

      test.define('whiiiooop').run(t => {
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
