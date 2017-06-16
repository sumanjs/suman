#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module, {
  $inject: ['abc']
});

Test.create(['parallel : false', 'timeout:3000', function (assert, before, beforeEach, it, after) {
  
  function makePromise() {
    return new Promise(function (resolve) {
      setTimeout(resolve, 10);
    })
  }

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
