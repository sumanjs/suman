#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {
  forceParallel: true  // parallel, not parallel-max
});

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create(function (test, setup, setupTest, setuptest, teardown, teardownTest, describe) {

  test('here we go');

  setup(h => {
    console.log('this is a setup..');
  });

  setuptest(h => {
    console.log('this is setupTest..');
  });

  describe('this is a nested thign', () => {

    test('here we go', t => {
       console.log('this is test.');
    });

    setupTest(h => {
      console.log('this is setupTest..');
    });

    teardownTest(h => {
      console.log('this is teardownTest..');
    });

  });



});
