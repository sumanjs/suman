'use strict';

const suman = require('suman');
const Test = suman.init(module);

/////////////////////////////////////////

Test.create('hotels1', {parallel: false}, function (it, before, beforeEach) {

  it.cb('first 1111', t => {
    setTimeout(t, 200);
  });

});

const Promise = require('bluebird');


Test.create('hotels2', function (it, before, beforeEach, describe) {


  before(h => {
     return Promise.delay(100);
  });

  it('first', t => {

  });

  describe('one',function () {

    it('second', t => {

    });

    describe('two',function () {


      it('third', t => {

      });



    });

  });


  // describe('innner1', function ($block) {
  //
  //   it.only.cb('third 1', t => {
  //     setTimeout(t, 100);
  //   });
  //
  //   it.only.cb('third 2');
  // });
  //
  // describe('innner2', function () {
  //
  //   it.cb('fourth', t => {
  //     setTimeout(t, 100);
  //   });
  // });
  //
  // describe('inner3', function () {
  //
  //   it.cb('fifth', t => {
  //     setTimeout(t, 100);
  //   });
  // });

});

