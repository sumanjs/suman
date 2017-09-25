#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (it, beforeEach, describe, assert, after) {

  beforeEach('<assert stuff>',h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });

  it.cb('glue', t => {
    setTimeout(t, 100);
  });

  Number(1).times(() => {

    describe('inner', function () {

      it('makes good', t => {
        t.assert(true, 'fudge.');
        t.assert.equal(true, true, 'damn');
      });

    });

  });

  // after.always.skip.last(h => {
  //   console.log('after always last');
  // });
  //
  // after.skip(h => {
  //   console.log('after after');
  // });

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
