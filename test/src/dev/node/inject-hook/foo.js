#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module, {}, {
  // series: false
  allowSkip: true
});

const Promise = require('bluebird');

///////////////////////////////////////////////////////////////////////

Test.create('indy', function (inject, context) {

  1..times(function () {

    context('inject', b => {

      inject(j => {
        j.register('foo', Promise.resolve('bar1')).then(function () {
          j.register('X', 'diggity')
        })
      });

      inject(j => {
        j.register('zoom', Promise.resolve('bar2'));
        // j.register('zoom', Promise.delay(500).then(v => 'bar2'));
      });


      inject.define(v => {
        v.cb(true)
        .run(j => {
          j.register('crumb', Promise.resolve('bar2'));
          j.done();
        });
      });

      // inject.cb(j => {
      //   j.register('crumb', Promise.resolve('bar2'));
      //   j.done();
      // });

      context('inner', (b, it) => {

        const [foo, zoom, x] = b.getInjectedValues('foo', 'zoom', 'X');

        it('test foo', t => {
          t.assert.equal(foo, 'bar1');
        });

        it('test bar', t => {
          t.assert.equal(zoom, 'bar2');
        });

        it('test x', t => {
          t.assert.equal(x, 'diggity');
        });

        context('inner', (b, it) => {

          const [foo, zoom, x] = b.getInjectedValues('foo', 'zoom', 'X');

          it('test foo', t => {
            t.assert.equal(foo, 'bar1');
          });

          it('test bar', t => {
            t.assert.equal(zoom, 'bar2');
          });

          it('test x', t => {
            t.assert.equal(x, 'diggity');
          });

          context('inner', (b, it) => {

            const [foo, zoom, x] = b.getInjectedValues('foo', 'zoom', 'X');

            it('test foo', t => {
              t.assert.equal(foo, 'bar1');
            });

            it('test bar', t => {
              t.assert.equal(zoom, 'bar2');
            });

            it('test x', t => {
              t.assert.equal(x, 'diggity');
            });

            context('inner', (b, it) => {

              const [foo, zoom, x] = b.getInjectedValues('foo', 'zoom', 'X');

              it('test foo', t => {
                t.assert.equal(foo, 'bar1');
              });

              it('test bar', t => {
                t.assert.equal(zoom, 'bar2');
              });

              it('test x', t => {
                t.assert.equal(x, 'diggity');
              });

            });
          });
        });

      });

    });
  });

});
