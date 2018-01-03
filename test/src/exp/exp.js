'use strict';

const suman = require('suman');
const Test = suman.init(module, {
  override: {
    opts: {
      allowSkip: true
    }
  }
});

Test.create(function (b,it, before, beforeEach, describe, context, after) {


  // beforeEach.cb(h => {
  //   return Promise.delay(2000);
  // });

  it.Cb('should pass');


  after.always.last(h => {
    console.log('after always last xxx');
  });

  after.always.cb(h => {
    console.log('after always last yyy');
    h();
  });

  before('merry', [{fatal: false}, t => {
    throw new Error('marf is not a marf');
  }]);

  beforeEach.cb('alpha', h => {
    setTimeout(h, 1);
  });

  it.cb('is normal xxx', ({done, ctn}) => {
    ctn();
  });

  // after('ooooooo', function () {
  //   console.log('original thought.');
  // });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    setTimeout(function(){
      t.done();
    }, 1000);
  });

  it.cb.skip('is NOT 222 skipped', t => {
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });

  // after('xxxx', function (t) {
  //   console.log(`original thought ${t.desc}.`);
  // });

  it.cb('is stubbed 1');

  describe.skip('foo', function (b) {

  });

  describe('pajamas', function (b) {

    describe('rudolph', function (b) {
      it('is cool', t => {

      });

      after.always.last(h => {
        console.log('after always last xxx 111');
      });

      after.always(h => {
        console.log('after always last yyy 222');
      });


    });

    it.cb.skip('is 222 skipped', t => {
      t.done();
    });

    beforeEach.cb('beta1', h => {
      setTimeout(h, 10);
    });

    beforeEach.cb('beta2', h => {
      setTimeout(h, 10);
    });

    it('is stubbed 2', null);

  });

  // describe('running', function () {
  //
  //   it('zoooom1');
  //
  //   describe('running A', function () {
  //
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //     it('zoooom2A');
  //
  //     after('eeeeeeee', function (t) {
  //       console.log(`original thought - ${t.desc}.`);
  //     });
  //
  //   });
  //
  //   describe('running B', function () {
  //
  //     it('zoooom2B');
  //
  //     describe('running B', function () {
  //
  //       it('zoooom2B');
  //
  //       after('uuuuuuuuu', function (t) {
  //         console.log(`original thought - ${t.desc}.`);
  //       });
  //
  //     });
  //
  //     after('yyyyyyy', function (t) {
  //       console.log(`original thought - ${t.desc}.`);
  //     });
  //
  //   });
  //
  //   describe('running C', function () {
  //
  //     it('zoooom2C');
  //     it('zoooom3C');
  //
  //   });
  // });

  // before.cb('done', t => {
  //
  //   t.done();
  //   t.done();
  //
  // });

});
