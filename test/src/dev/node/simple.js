#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create('X', (test, context) => {

  1..times(function () {

    context('silly', function (b) {

      test('is', t => {

      });

    });

  });

});
