'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////

// Test.create('hotels1', {parallel: false}, function (it, before, beforeEach) {
//
//   it.cb('first', t => {
//     setTimeout(t, 200);
//   });
//
// });

//////////

Test.create('hotels2', {parallel: false}, function (it, before, beforeEach, describe) {

  it.cb('second', t => {
    setTimeout(t, 100);
  });

  describe('innner', function () {

    it.cb('third', t => {
      setTimeout(t, 100);
    });
  });

  describe('outer', function () {

    it.cb('fourth', t => {
      setTimeout(t, 100);
    });
  });

});

