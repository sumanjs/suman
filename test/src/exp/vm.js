const suman = require('suman');//
const Test = suman.init(module);

const Promise = require('bluebird');

Test.create('A', function (it, before, afterEach, beforeEach, assert, describe, after, util) {

  before(h => {
    h.$inject.foo = 3;
  });

  after.last(h => {
    return Promise.delay(10);
  });


  after(h => {
    return Promise.delay(10);
  });

  afterEach.cb(h => {
    setTimeout(h.done, 150);
  });

  describe('B', function (b) {

    it('1', {throws: /in test cases/}, t => {
      t.assert.equal(t.$inject.foo, 3);
      t.$inject.foo = 4;
    });

    describe('F', function(b){

      it('d',t => {
        return Promise.delay(10);
      });

      after(h => {
        return Promise.delay(30);
      });

    });

    describe('F', function(b){

      it('sd',t => {
        return Promise.delay(10);
      });

      after(h => {
        return Promise.delay(10);
      });

    });

    after(h => {
      return Promise.delay(30);
    });

    describe('C', function (b) {

      it('2', {throws: /in test cases/}, t => {
        t.assert.equal(t.$inject.foo, 3);
        t.$inject.zoo = 5;
      });


      describe('D', function (b) {

        it('3', t => {
          t.assert.equal(t.$inject.zoo, undefined);
        });

      });

    });

  });

});

