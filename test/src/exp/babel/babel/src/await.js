#!/usr/bin/env node

'use strict';

const suman = require('suman');
const Test = suman.init(module, {});


Test.create('root suite description', {}, function () {   // we define the root suite

  //note: we are in the context of the "root suite"

  const self = this;    // (avoid the self pattern in Suman tests, here for explanation only :)

  this.before('aeageo', async function () {
    const bnans = await new Promise(function (resolve) {
      resolve('bananas')
    });
    console.log('bananas:', bnans);
    console.log('1', this === self); //true
  });

  this.it('grjp', function () {
    console.log('yes');
  });

  this.it('peaglg', function () {
    console.log('yes');
  });

  this.it('ageage', function () {
    console.log('yes');
  });

});
