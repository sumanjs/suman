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

  describe('innner1', function ($block) {

    it.only.cb('third 1', t => {
      setTimeout(t, 100);
    });

    it.only.cb('third 2');
  });

  describe('innner2', function () {

    it.cb('fourth', t => {
      setTimeout(t, 100);
    });
  });

  describe('inner3', function () {

    it.cb('fifth', t => {
      setTimeout(t, 100);
    });
  });

});

