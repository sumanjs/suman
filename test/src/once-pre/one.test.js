#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module, {
  pre: ['three']
});

Test.create(function (assert) {

  this.it('closes', t => {
  });

});
