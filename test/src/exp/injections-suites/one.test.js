#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(['delay:false', function (assert, inject, describe, lodash, chuck, mark, util) {

  inject('zoom', i => {
    i.registerKey('zoom', {foo: 'bar'})
  });

  inject(i => {
    i.registerMap({
      foo: 'star',
      bar: 'chicken'
    });
  });

  describe('vram', b => {

    const [zoom] = b.getInjectedValues('zoom');
    assert(lodash.isEqual(zoom, {
      foo: 'bar'
    }));

    describe('vram', b => {

      const [zoom] = b.getInjectedValues('zoom');
      assert(lodash.isEqual(zoom, {
        foo: 'bar'
      }));

      describe('vram', b => {

        const [foo] = b.getInjectedValues('foo');
        assert(lodash.isEqual(foo, 'star'));

      });

    });

    describe('vram', b => {

      const [bar] = b.getInjectedValues('bar');
      assert.equal(bar, 'chicken');

    });

  });

}]);
