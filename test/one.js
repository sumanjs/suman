const suman = require('suman');
const Test = suman.init(module);

Test.create((describe, it, context, before, beforeEachBlock, afterEachBlock) => {

  let count = 1;

  beforeEachBlock(h => {
    console.log('before each block');
  });

  afterEachBlock(h => {
    console.log('after each block');
  });

  context('fo', b => {

    before(async h => {
      h.supply.foo = 5;
    });

    it('foo', async t => {
      t.assert.equal(t.supply.foo, 5);
      t.assert.equal(count++, 1)
    });

  });

  context('fo', b => {

    before.cb( h => {
      setTimeout(function () {
        h.supply.foo = 4;
        h.done();
      }, 10);

    });

    it('foo', async t => {
      t.assert.equal(t.supply.foo, 4);
      t.assert.equal(count++, 2)
    });

  });

  context('fo', b => {

    before(async h => {
      h.supply.foo = 3;
    });

    it('foo', async t => {
      t.assert.equal(t.supply.foo, 3);
      t.assert.equal(count++, 3)
    });

  });

  context('fo', b => {

    before.cb( h => {
      setTimeout(function () {
        h.supply.foo = 9;
        h.done();
      }, 30);
    });

    it('foo', async t => {
      t.assert.equal(t.supply.foo, 9);
      t.assert.equal(count++, 4);
    });

  });

});
