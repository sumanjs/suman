#!/usr/bin/env node
'use strict';

const suman = require('suman');
const {Test} = suman.init(module);

Test.define('ballistic')
.parallel(true)
.run(function (b, test, context, after) {

  b.set('a', {foo: true});

  test('home', t => {

    debugger;
    t.final(function(){
      debugger;
       t.assert(false);
    });

  });

  context('inner', b => {

    b.set('b', {bar: 4});

    test.define('zoomrah')
    .throws(/Cannot assign to read only property/)
    .run(t => {
      const z = b.get('a');
      debugger;
      // throw 'Cannot assign to read only property';
      z.foo = 5;
    })
    .run(t => {
      const z = b.get('a');
      t.assert.equal(z.foo, true);
      z.foo = 5;
    });
  });

  after.define('hi')
  .run(h => {
    const z = b.get();
    debugger;
  });

});

Test.define('ballistic', v => {

  v.parallel(true)
  .run(function (b, test, context, after) {

    b.set('a', {foo: true});

    context('inner', b => {

      b.set('b', {bar: 4});

      test.define('rghh')
      .throws(/Cannot assign to read only property/)
      .run(t => {
        const z = b.get('a');
        z.foo = 5;
      })
      .run(t => {
        const z = b.get('a');
        t.assert.equal(z.foo, true);
        z.foo = 5;
      });
    });

    after.define('hi')
    .run(h => {
      const z = b.get();
      h.assert.equal(z.a.foo, true);
    });

  })
  .run(function (b, test, context, after) {

    b.set('a', {foo: true});

    context('inner', b => {

      b.set('b', {bar: 4});

      test.define('rghh')
      .throws(/Cannot assign to read only property/)
      .run(t => {
        const z = b.get('a');
        z.foo = 5;
      })
      .run(t => {
        const z = b.get('a');
        t.assert.equal(z.foo, true);
        z.foo = 5;
      });
    });

    after.define('hi')
    .run(h => {
      const z = b.get();
    });

  })
  .run(function (b, test, context, after) {

    b.set('a', {foo: true});

    context('inner', b => {

      b.set('b', {bar: 4});

      test.define('rghh')
      .throws(/Cannot assign to read only property/)
      .run(t => {
        const z = b.get('a');
        z.foo = 5;
        debugger;
      })
      .run(t => {
        const z = b.get('a');
        t.assert.equal(z.foo, true);
        z.foo = 5;
      });

    });

    after.define('hi')
    .run(h => {
      debugger;
      const z = b.get();
      debugger;
    });

  });
});


