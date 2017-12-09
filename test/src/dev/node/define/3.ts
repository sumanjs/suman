#!/usr/bin/env node
'use strict';

import suman, {s} from 'suman';
const {Test} = suman.init(module);

Test.create(function () {

});

Test.define('groovy', (v: s.DefObjContext) => {
  

  v.mode('parallel')
  .source()
  .names()
  .run(t => {})
  .timeout(10)
  .mode('parallel')
  .run((b, it, describe, test: s.ItFn) => {
    
    b.set('is', 'cool');
    
    test.define('yes')
    .series(true);

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
