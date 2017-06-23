#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module, {
  $inject: ['abc'],
  pre: [
    'one'
  ],
  ioc: {
    sam: true
  }
});

Test.create(['parallel : false, timeout:3000', function (assert, before, beforeEach, it, after, chuck, mark) {

  
  function makePromise() {
    return new Promise(function (resolve) {
      setTimeout(resolve, 10);
    })
  }

  beforeEach(h => {

  });

  it('is one', t => {
    return makePromise();
  });

  it('is one', t => {
    return makePromise();
  });

  it('is one', t => {
    return makePromise();
  });

  it('is one', t => {
    return makePromise();
  });

}]);
