#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(['delay:false', function (assert, inject, describe, lodash, chuck, mark, util) {

  // setTimeout(resume, 1);

  inject.cb('zoom', i => {

    process.nextTick(i.wrapErrFirst(function () {
      i(null, {
        foo: 'bar'
      });
    }));

  });

  inject.cb(i => {

    process.nextTick(i.wrapErrFirst(function () {
      i(null, {
        foo: 'star',
        bar: 'chicken'
      });
    }));

  });

  describe('vram', zoom => {

    console.log('zoom 1 => ', zoom);

    assert(lodash.isEqual(zoom, {
      foo: 'bar'
    }));

    describe('vram', zoom => {
      console.log('zoom 2 => ', zoom);

      assert(lodash.isEqual(zoom, {
        foo: 'bar'
      }));

      describe('vram', foo => {

        console.log('foo 1 => ', foo);

        assert(lodash.isEqual(foo, 'star'));

      });

    });

    describe('vram', bar => {

      console.log('bar 1 => ', bar);

      assert.equal(bar, 'chicken');

    });

  });

}]);
