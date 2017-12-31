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




});

