#!/usr/bin/env node
'use strict';

import suman, {IDefObjTestCase, ItFn} from 'suman';
const {Test} = suman.init(module as any);

Test.create(function () {

});

Test.define('groovy', v => {

  v.timeout(10).mode('a').source('age', 'age', 'age')
  .run((b, it, describe, test: ItFn) => {

    b.set('is', 'cool');

    test.series.cb.define('turtle')
    .timeout(10)
    .run(t => {
      t.assert.equal(b.get('is'), 'cool', 'sandy');
    });

    describe('inner', b => {

      it('is cool hand luke 1', t => {

      });

      it('is cool hand luke 2', t => {

      });

      it('is cool hand luke 3', t => {

      });

    });
  });
});

Test.define(v => {

  v.inject()
  .source('mika')
  .run((b, before, after, afterEach, it) => {

    const {mika} = b.ioc;

    before.define(v =>
      v.first(true)
      .timeout(300)
      .run(h => {

      }));

    it('is cool 1', t => {

    });

  })
  .run((b, before, after, afterEach, it) => {

    before.define(v =>
      v.timeout(3000)
      .cb(true)
      .run(h => {

      }));

    it('is cool 2', t => {

    });

  });

});