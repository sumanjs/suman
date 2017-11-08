#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {});

///////////////////////////////////////////////////////////////////////

Test.create(function (b, test, setup, setupTest, setuptest, teardown, teardownTest, describe) {

  test('here we go1', {retries: 5}, t => {

    return Promise.reject('foo').catch(function () {
      t.skip();
    });

  });

  test('here we go2', {retries: 9}, t => {
    return Promise.reject('foo');
  });

  test('here we go3', {retries: 4}, t => {
    return Promise.reject('foo');
  });

});
