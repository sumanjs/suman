const suman = require('suman');//
const Test = suman.init(module);

Test.create('A', function (it, before, afterEach, beforeEach, assert, describe, after, util) {

  before(h => {
    h.$inject.foo = 3;
  });

  afterEach(h => {

    console.log('h is => ',util.inspect(h));
    debugger;
  });

  describe('B', function () {

    it('1', t => {
      t.assert.equal(t.$inject.foo, 3);
      t.$inject.foo = 4;
    });

    after(h => {
      console.log('after 1');
    });

    describe('C', function () {

      it('2', t => {
        t.assert.equal(t.$inject.foo, 3);
        t.$inject.zoo = 5;
      });

      after(h => {
        console.log('after 2');
      });

      describe('D', function () {

        after(h => {
          console.log('after 3');
        });

        it('3', t => {
          t.assert.equal(t.$inject.zoo, undefined);
        });

      });

    });

  });

});

