#!/usr/bin/env node
'use strict';

debugger;  ////////////////////////////// here

const suman = require('suman');
const { Test } = suman.init(module);

debugger;  //////////////////////////////  and here

Test.define('groovy')
  .always(true)
  .timeout(10)
  .source('age', 'age', 'age')
  .run((b, it, describe, test) => {

    b.set('is', 'cool');

    test.define(v => {
      v.name('turtle')
        .run(t => {
          debugger;      //////////////////////////////////// and here too!
          t.assert.equal(b.get('is'), 'cool', 'sandy');
        });
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



Test.define(v => {

  v.inject('age', 'age', 'age')
    .source('mika')
    .run((b, before, after, afterEach, it) => {

      const { mika } = b.ioc;

      console.log('mika => ', mika);

      before.define(v =>
        v.source('mika')
          .first(true)
          .timeout(300)
          .run(h => {
            debugger;
            console.log('this is before');
          }));

      it('is cool 1', t => {
        debugger;
      });

    })
    .run((b, before, after, afterEach, it) => {

      before.define(v =>
        v.source('mika').timeout(300)
          .run(h => {
            debugger;
            console.log('this is before');
          }));

      it('is cool 2', t => {

      });

    });

});
