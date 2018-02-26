'use strict';

const suman = require('suman');
const Test = suman.init(module, {
  pre: ['dog'],
  post: ['smartconnect']
});

////

Test.create('hotels', function (b,it, before, beforeEach, after, context, afterAllParentHooks, sheep) {

  beforeEach(t => {
    console.log('parent before each');
    console.log('before each hook', t.get('x'));
  });
  

  it('makes assertion', t => {
    t.supply.v = 5;
    t.assert(false, 'this was a problem');
  });

  it('makes assertion', t => {
    console.log('t.supply.v => ',t.supply.v);
    t.assert.equal(false, true, 'these are not equal');
  });

  b.set('x', {v: true});

  before(t => {
    t.supply.v = 5;
    console.log('parent before');
    console.log('first before says:', t.get('x'));
  });

  context('foo', function (b) {

    b.set('x', 5);

    context('zoom', function (b) {
      console.log('inner context', b.get('x'));
    });

    before(t => {
      console.log('before says 1:', t.get('x'));
    });

    beforeEach(t => {

    });

    it('test this', t => {
      console.log('it says 1:', t.get('x'));
    });

  });

  context('zoo', function (b) {

    console.log('zoo says:', b.get('x'));

    before(t => {
      console.log('child 2 before');
    });

    afterAllParentHooks('yes', t => {
      console.log('after all parent hooks');
    });

    beforeEach(t => {
      console.log('child 2 before each');
    });

    it('woo a test', t => {
      console.log('it says 2:', t.get('x'));
    });

  });

});
