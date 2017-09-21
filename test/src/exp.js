'use strict';

const suman = require('suman');
const Test = suman.init(module);
// const Promise = require('bluebird');

// Test.create(function (assert, it, before, afterEach, describe, after, beforeEach) {

Test.create(function(it, before, beforeEach, describe, context){


  // beforeEach.cb(h => {
  //   return Promise.delay(2000);
  // });

  beforeEach.cb(h => {
    console.log('before each');
    setTimeout(h, 1000);
  });

  it.cb('is normal', t => {
    t.done();
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
    t.done();
  });

  it.cb('is NOT skipped', t => {
    t.done();
  });


  it.cb('is NOT skipped', t => {
    t.done();
  });
  // after('xxxx', function (t) {
  //   console.log(`original thought ${t.desc}.`);
  // });

  it.cb('is stubbed 1');

  describe('pajamas', function(){

    it.cb('is stubbed 2');
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
