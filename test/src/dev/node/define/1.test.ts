#!/usr/bin/env ts-node
'use strict';

import suman, {ItFn} from 'suman';
const {Test} = suman.init(module);

Test.create(function (it) {

  it.cb('here', t => {
    t.done();
  });

});

Test.define('groovy', v => {

  v.timeout(1000)
  .source('age', 'age', 'age')
  .run((b, it, describe, test: ItFn) => {

    b.set('is', 'cool');

    test.define('turtle').series(true).cb(true).timeout(1000)
    .cb(true)
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

    before.cb.define(v =>
      v.timeout(300)
      .run(h => {
        h.ctn();
      }));

    it('is cool 2', t => {

    });

  });

});
