#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (assert, it, before) {

  it.cb('is true', t => {

    t.done();
    t.done();
    // throw 'blah';

  });

  before.cb('done', t => {

    t.done();
    t.done();

  });

});
