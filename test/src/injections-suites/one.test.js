#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module);

Test.create(function (assert, inject, describe) {

  inject.cb('zoom', i => {

    process.nextTick(i.wrapErrFirst(function () {
      i(null, {
        foo: 'bar'
      });
    }));

  });

  describe('vram', zoom => {

    console.log(zoom);

  });

});
