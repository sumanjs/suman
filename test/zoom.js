#!/usr/bin/env node

const suman = require('suman');//
const Test = suman.init(module);

Test.create(function (it, beforeEach, describe, assert) {

  beforeEach(h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });

  it.only('glue', t => {

  });

  Number(100).times(function () {

    describe.skip('inner', function () {

      it('makes good', t => {
        t.assert(true, 'fudge.');
        t.assert.equal(true, true, 'damn');
      });

    });

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
