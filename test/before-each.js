'use strict';

const suman = require('suman');
const Test = suman.init(module);

// const Promise = require('bluebird');

///////////////////////////////////////////

Test.create('hotels1', function (it, before, beforeEach, describe, context, util) {

  beforeEach.cb(h => {
    setTimeout(h, 100);
  });

  it.cb('first', t => {
    setTimeout(t, 100);
  });

  it.cb('second', t => {
    setTimeout(t, 100);
  });

  it.cb('third', t => {
    setTimeout(function(){
      throw new Error('cheeseburger');
    },100);
  });

  it.cb('fourth', t => {
     return Promise.resolve({}).then(function(){
       throw 'marf1';
    });
  });

  it.cb('fifth', t => {
    return Promise.resolve({}).then(function(){
      setTimeout(function(){
        throw 'marf2';
      }, 100);
    });
  });

  context('inner block A', function(){

    it.cb('third', t => {
      setTimeout(t, 100);
    });

    it.cb('fourth', t => {
      setTimeout(t, 100);
    });

    context('inner block B', function(){

      it.cb('fifth', t => {
        setTimeout(t, 100);
      });

      it.cb('sixth', t => {
        setTimeout(t, 100);
      });
    });
  });

  context('inner block C', function(){

    it.cb('seventh', t => {
      setTimeout(t, 100);
    });

    it.cb('eighth', t => {
      setTimeout(t, 100);
    });

    context('inner block D', function(){

      it.cb('ninth', t => {
        setTimeout(t, 100);
      });

      it.cb('tenth', t => {
        setTimeout(t, 100);
      });
    });
  });


  context('inner block E', function(){

    it.cb('eleventh', t => {
      setTimeout(t, 100);
    });

    it.cb('twelth', t => {
      setTimeout(t, 100);
    });

    context('inner block F', function(){

      it.cb('thirteenth', t => {
        setTimeout(t, 100);
      });

      it.cb('fourteenth', t => {
        setTimeout(t, 100);
      });
    });
  });

});

