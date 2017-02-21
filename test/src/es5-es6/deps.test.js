#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (assert, $deps, async, function_arguments) {

  this.it('tests deps', function(){

    assert(require('function-arguments') === function_arguments);
    assert(require('async') === async);
    assert(require('async') === $deps.async);

  });


});
