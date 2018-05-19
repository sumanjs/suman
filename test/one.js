const suman = require('suman');
const Test = suman.init(module);

Test.create((describe, it, context, before, beforeEachBlock, afterEachBlock) => {

  let count = 1;

  beforeEachBlock(h => {
    console.log('before each block with name:', h.block.title);
    h.block.startTime = Date.now();
  });

  afterEachBlock(h => {
    console.log('after each block with name:', h.block.title);
    const totalTimeMillis = Date.now() - h.block.startTime;
    console.log('total time:', totalTimeMillis);
  });

  describe('one', b => {
    before.cb(h => {
      setTimeout(h, 150);
    });
  });

  describe('two', b => {
    before.cb(h => {
      setTimeout(h, 100);
    });
  });

  describe('three', b => {

    before.cb(h => {
      setTimeout(h, 200);
    });

  });

});
