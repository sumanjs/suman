const suman = require('suman');//
const Test = suman.init(module);

const Promise = require('bluebird');

Test.create('A', function (it, before, afterEach, beforeEach, assert, describe, after, util) {

  before(h => {
    h.$inject.foo = 3;
  });

  after.last(h => {
    console.log('after 00');
    return Promise.delay(100);
  });


  after(h => {
    console.log('after 01');
    return Promise.delay(1000);
  });

  afterEach.cb(h => {

    console.log('h is', h);
    setTimeout(h.done, 300);
    // console.log('h is => ',util.inspect(h));
  });

  describe('B', function () {

    it('1', t => {
      t.assert.equal(t.$inject.foo, 3);
      t.$inject.foo = 4;
    });

    describe('F', function(){

      it('d',t => {
        return Promise.delay(1000);
      });

      after(h => {
        console.log('after zzz2');
        return Promise.delay(300);
      });

    });

    describe('F', function(){

      it('sd',t => {
        return Promise.delay(1000);
      });

      after(h => {
        console.log('after zzz1');
        return Promise.delay(100);
      });

    });

    after(h => {
      console.log('after 1');
      return Promise.delay(300);
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

