#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {});

///////////////////////////////////////////////////////////////////////



Test.create(function (b, test, setup, setupTest, setuptest, teardown, teardownTest, describe) {


  test('here we go', {retries: 3}, t => {
       return Promise.reject('foo');
  });



});
