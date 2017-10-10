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

  const x = this;
  debugger;
  // console.log(this.describe);
  debugger;

  this.shared.set('users', 888);

  setup({}, h => {
    console.log('this is a setup..');
    console.log(h.get('users'));
  });

  setuptest(h => {
    console.log('this is setupTest..');
  });

  describe('this is a nested thign', function () {

    debugger;
    this.shared.set('users', 999);

    test('here we go', t => {
      console.log('this is test.');
      console.log(t.get('users'));
    });

    setupTest(h => {
      console.log('this is setupTest..');
    });

    teardownTest(h => {
      console.log('this is teardownTest..');
    });

  });

});
