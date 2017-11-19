#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {}, {
  // series: false
});

Test.define(v => {

  v.inject('age', 'age', 'age')
  .names('b', 'before', 'after', 'afterEach')
  .run((b, before, after, afterEach, it) => {

    before.define(v =>
      v.inject('3').timeout(300)
      .run(h => {
        debugger;
        console.log('this is before');
      })
      .run(async h => {
        debugger;
        console.log('this is before');
      })
      .run(h => {
        debugger;
        console.log('this is before');
      })
      .run(h => {
        debugger;
        console.log('this is before');
      }));

    it('is cool 1', t => {
        debugger;
    });

  })
  .run((b, before, after, afterEach, it) => {

    it('is cool 2', t => {

    });

  });

});
