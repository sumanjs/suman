#!/usr/bin/env node

console.log('is this ready.');

const suman = require('suman');//
const Test = suman.init(module);

let val = 1;

//

Test.create(String(val++), function (it, beforeEach) {

  beforeEach(h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });

  Number(1).times(function () {

    it('makes good', t => {
      t.assert(true, 'fudge.');
      t.assert.equal(true, true, 'damn');
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
