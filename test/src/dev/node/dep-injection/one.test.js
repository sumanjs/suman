#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(['bat', 'suit', {only: true}, function (b, assert, describe, before, beforeEach, after, afterEach, it) {

  describe('fantastic', ['zzz', function (b, it) {

    it('test 1', t => {

    });

    describe('fantastic', ['www', function (b) {

      debugger;
      const {bat, suit} = b.ioc;

      console.log('bat ', bat);
      console.log('suit', suit);

      it('test 2', t => {

      });

    }]);

  }]);

}]);

Test.create(['aaa', 'bbb', 'ccc', (b, describe, before, after, afterEach) => {

  const {aaa, bbb, ccc} = b.ioc;

  describe('hi', ['radical', b => {

    const {radical} = b.ioc;

  }]);

  // const {sham, ram} = b.ioc;
  // const {zoom, boom} = b.iocStatic;
  //
  // debugger;
  //
  // describe('hiya', b => {
  //
  //   console.log('assert => ', sheep);
  //   console.log('assert => ', assert);
  //
  // });

}]);


Test.define('roo')
.source('bat', 'suit')
.run(b => {

  console.log('B dot i.o.c.', b.ioc);
  console.log('B dot i.o.c.', b.getSourcedValues('bat'));

})
.run(b => {

  console.log('B dot i.o.c.', b.ioc);
});
