#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

///////////////////////////////////////////////////////////////////////

Test.create(function (b, assert, describe, before, beforeEach, after, afterEach, it) {

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

  b.m.describe('fantastic', function (b, it) {

    it('test 1', t => {

    });

    b.m.describe('fantastic', function (b) {

      it('test 2', t => {

      });
    });

  });

});

Test.create(['aaa', 'bbb', 'ccc', (b, describe, before, after, afterEach) => {

  const {aaa, bbb, ccc} = b.ioc;

  console.log('aaa => ', aaa);

  describe('hi', ['radical', b => {

    const {radical} = b.ioc;

    console.log('radical => ', radical);

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
