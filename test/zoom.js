#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (it, beforeEach, describe, assert, after) {

  beforeEach(h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });

  it('glue', t => {

  });

  Number(1).times(() => {

    this.describe('inner', function () {

      throw 'buggers';

      it.only('makes good', t => {
        t.assert(true, 'fudge.');
        t.assert.equal(true, true, 'damn');
      });

    });

  });

  after.always.last.last.always(h => {
      console.log('after always last');
  });

  after(h => {
    console.log('after after');
  });

});

// {
//   Test.create(String(val++), function (it) {
//     it('makes good', t => {
//
//     });
//   });
// }
//
// {
//   Test.create(String(val++), function (it) {
//     it('makes good', t => {
//
//     });
//   });
// }
// //
// {
//   Test.create(String(val++), function (it) {
//     it('makes good', t => {
//
//     });
//   });
// }
//
// //
// //
