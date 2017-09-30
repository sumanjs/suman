#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (assert, $deps, async, $core, function_arguments, william) {

  this.it('tests deps', function () {
    assert(require('function-arguments') === function_arguments);
    assert(require('async') === async);
    assert(require('async') === $deps.async);
  });

  this.it('test core deps', t => {
    assert($core.http);
    assert($core.stream);
    assert($core.net);
  });

});

Test.create(function (assert, $deps, async, $core, function_arguments, william) {

  console.log('william => ', william);

  this.it('tests deps', function () {
    assert(require('function-arguments') === function_arguments);
    assert(require('async') === async);
    assert(require('async') === $deps.async);
  });

  this.it('test core deps', t => {
    assert($core.http);
    assert($core.stream);
    assert($core.net);
  });

});

