#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

Test.create(function (it) {

  it.cb('here', t => {
    t.done();
  });

});

Test.define('groovy', v => {

  v.timeout(1000)
  .source('age', 'age', 'age')
  .run((b, it, describe, test) => {

    b.set('is', 'cool');

    test.define('turtle').series(true).cb(true).timeout(1000)
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

  v.inject('age', 'age', 'age')
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
