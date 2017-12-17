#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {
  forceParallel: true  // parallel, not parallel-max
});

///////////////////////////////////////////////////////////////////////

let count = 0;

Test.create(function (b, test) {

  test('tomorrow', t => {

    t.done();
    debugger;
    // const x = t.skirt.foo;
    // console.log(x);
    t.assert(true);
    t.assert.equal(true, true);
    t.expect(function () {}).to.not.throw();

  });

});
