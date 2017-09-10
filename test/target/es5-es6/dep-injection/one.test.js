'use strict';

var suman = require('suman');
var Test = suman.init(module, {});

Test.create('example', function (before, describe) {

  before(function (t) {

    //////

  });

  describe('inner-hooks', function (before) {

    before('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (b1) !');
      });
    });

    before('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (b2) !');
      });
    });

    before('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (b3) !');
      });
    });
  });

  describe('inner', function (it) {

    it('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (1) !');
      });
    });

    it('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (2) !');
      });
    });

    it('makes testing fun', function (t) {

      t.on('done', function () {
        console.log('t is done (3) !');
      });
    });
  });

  describe.delay('inner', function (beforeEach, it, suite) {

    suite.resume();

    beforeEach(function (t) {});

    it('makes testing fun', function (t) {});

    it.cb('makes testing fun', function (t) {
      t.done();
    });
  });
});