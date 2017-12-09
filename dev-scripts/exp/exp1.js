const suman = require('suman');
const {Test} = suman.init(module);

const Promise = require('bluebird');

Test.define('freakshow')
.source('mika')
.run(function (b, it, beforeEach) {

  it.define('rob').run(t => {
    t.assert.equal(b.ioc.mika, 'barky');
  });

  debugger;
  beforeEach.define('cool')
  .run(h => {
    console.log('here we go');
    debugger;
    throw new Error('yums');
  });

  // beforeEach.define(v => {
  //   v.description('cool')
  //   .run(h => {
  //       return Promise.delay(10000)
  //   });
  // });

});

