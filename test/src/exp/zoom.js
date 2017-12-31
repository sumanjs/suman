#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

////////////////////////////////////////////////////////

Test.create(function (it, beforeEach, describe, assert, after) {

  beforeEach('hook', h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });


  it.cb.parallel('glue', t => {
    setTimeout(t, 100);
  });

  100..times(() => {

    describe('inner', function () {

      it('makes good 1', t => {

        return Promise.resolve(null).then(function () {
          t.assert(true, 'fudge.');
          t.assert.equal(true, true, 'damn');
        });

      });

      it.cb('makes good 2', t => {

        return Promise.resolve(null).then(function () {
          setTimeout(function () {
            t.assert(true, 'fudge.');
            t.assert.equal(true, true, 'shazam');
            t.done();
          }, 30);

        });

      });

    });

  });

});

