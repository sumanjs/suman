'use strict';

const suman = require('suman');
const Test = suman.init(module);

///////////////////////////////////////////

Test.create('hotels1', {parallel: true}, function (it, before, beforeEach, describe, context) {

  beforeEach.cb(h => {
    console.log('before each');
    setTimeout(h, 2000);
  });

  it.cb('first', t => {
    setTimeout(t, 100);
  });

  it.cb('second', t => {
    setTimeout(t, 100);
  });

  context('inner block', function(){

    it.cb('third', t => {
      setTimeout(t, 100);
    });

    it.cb('fourth', t => {
      setTimeout(t, 100);
    });

    context('inner block', function(){

      it.cb('fifth', t => {
        setTimeout(t, 100);
      });

      it.cb('sixth', t => {
        setTimeout(t, 100);
      });
    });
  });

  context('inner block', function(){

    it.cb('seventh', t => {
      setTimeout(t, 100);
    });

    it.cb('eighth', t => {
      setTimeout(t, 100);
    });

    context('inner block', function(){

      it.cb('ninth', t => {
        setTimeout(t, 100);
      });

      it.cb('tenth', t => {
        setTimeout(t, 100);
      });
    });
  });

});

