#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(function (assert, describe, before, beforeEach, after, afterEach, it) {

  it('sync test', t => {
       assert(true);
  });

  it('async test', t => {
    return Promise.resolve('foo').then(v => {throw v});
  });

  it.cb('async callback test', t => {

    // call t.done, t.fail, t.fatal when you're done
    // t itself is a function! with the same signature as t.done.
    t.done(err);

  });

});
