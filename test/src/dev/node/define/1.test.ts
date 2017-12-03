#!/usr/bin/env ts-node
'use strict';

import * as suman from 'suman';
import {s} from 'suman';
const {Test} = suman.init(module);
type ctxfn = (b: s.ITestSuite, it: s.ItFn, describe: s.IDescribeFn, test: s.ItFn) => void;

// const x = s.DefObjEachHook;


Test.create(function (it) {

  it.cb('here', t => {
    t.done();
  });
  

});


Test.define('groovy', v => {

  v.timeout(1000)
  .source('age', 'age', 'age')
  .run(<ctxfn> ((b, it, describe, test) => {
    
    b.set('is', 'cool');

    test.cb.define('turtle')
    .series(true)
    .cb(true)
    .timeout(1000)
    .run(t => {
      t.assert.equal(b.get('is'), 'cool', 'sandy');
      t.done();
    });

    describe('inner', b => {

      it('is cool hand luke 1', t => {

      });

      it('is cool hand luke 2', t => {

      });

      it('is cool hand luke 3', t => {

      });

    });
  }));
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

    before.cb.define(v =>
      v.timeout(300)
      .run(h => {
        h.ctn();
      }));

    it('is cool 2', t => {

    });

  });

});
