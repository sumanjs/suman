#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (assert, it, before, describe, after) {

  // console.error('123');

  it.cb('is normal', t => {

    t.done();
    // t.done();
    // throw 'blah';

  });

  after('ooooooo', function () {
    console.log('original thought.');
  });

  it.cb.skip('is skipped', t => {

    t.done();
    // t.done();
    // throw 'blah';

  });

  after('xxxx', function (t) {
    console.log(`original thought ${t.desc}.`);
  });

  it.cb('is stubbed');

  describe('running', function () {

    it('zoooom1');

    describe('running A', function () {

      it('zoooom2A');
      it('zoooom2A');
      it('zoooom2A');
      it('zoooom2A');
      it('zoooom2A');
      it('zoooom2A');

      after('eeeeeeee', function (t) {
        console.log(`original thought - ${t.desc}.`);
      });

    });

    describe('running B', function () {

      it('zoooom2B');

      describe('running B', function () {

        it('zoooom2B');

        after('uuuuuuuuu', function (t) {
          console.log(`original thought - ${t.desc}.`);
        });

      });

      after('yyyyyyy', function (t) {
        console.log(`original thought - ${t.desc}.`);
      });

    });

    describe('running C', function () {

      it('zoooom2C');
      it('zoooom3C');

    });
  });

  // before.cb('done', t => {
  //
  //   t.done();
  //   t.done();
  //
  // });

});
