#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (it, beforeEach, describe, assert, after) {

  beforeEach('hook', h => {
    h.assert('i', 'melon');
    h.assert.equal(true, true, 'moo');
  });

  it.cb('glue', t => {
    setTimeout(t, 100);
  });

  100..times(() => {

    describe.parallel('inner',function () {

      it('makes good 1', t => {

        return Promise.resolve(null).then(function () {
          t.assert(true, 'fudge.');
          t.assert.equal(true, false, 'damn');
        });

      });

      it.cb('makes good 2', t => {

        return Promise.resolve(null).then(function () {
          setTimeout(function () {
            t.assert(true, 'fudge.');
            t.assert.equal(true, false, 'shazam');
            t.done();
          }, 100);

        });

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
