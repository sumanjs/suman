#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {
  forceParallel: true  // parallel, not parallel-max
});

const async = require('async');

///////////////////////////////////////////////////////////////////////

let count = 0;

async.series({
    a: async function () {
      await 300;
      return 5;
    }
  },
  function (err, results) {

  if(err){
    throw err;
  }

  console.log('results => ', results);
  
    Test.create(function (b, test) {
    
      // test('tomorrow', t => {
      //
      //   // t.done();
      //   debugger;
      //   // const x = t.skirt.foo;
      //   // console.log(x);
      //   t.assert(true);
      //   t.assert.equal(true, true);
      //   t.expect(function () {}).to.not.throw();
      //
      // });
    
    
    
    });
  
  
  });

