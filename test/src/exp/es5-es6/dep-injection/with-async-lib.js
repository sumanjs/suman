const suman = require('suman');
const Test = suman.init(module, {});

Test.create('example', function (before, describe, inject, async) {

  function run(a, cb) {
    setTimeout(function () {
      cb(null, a);
    }, 100);
  }

  inject.cb('yyy', i => {

    async.parallel({
      foo: run.adhere('foo'),
      bar: run.adhere('bar'),
      baz: run.adhere('baz')
    }, i);

  });

  inject.cb('zzz', i => {
    i(null, {xxx: 'zoooo'})
  });

  inject('zaul', async i => {

    const z = await Promise.all([
      new Promise(function (resolve) {
        resolve('sally');
      })
    ]);

    return {
      z
    };

  });

  inject('raul', i => {

    return Promise.all([
      new Promise(function (resolve) {
        resolve('sally');
      })
    ]);

  });

  inject(i => {

    return Promise.all([
      new Promise(function (resolve) {
        resolve({
          a: 'aaaaa'
        });
      }),
      new Promise(function (resolve) {
        resolve({
          b: 'bbbb'
        });
      }),
      new Promise(function (resolve) {
        resolve({
          c: 'cccccc'
        });
      })
    ]).then(function (values) {
      return values.mapToObject();
    });

  });

  describe('inner-hooks', function (before, yyy, zzz, zaul, raul, a, b, c) {

    console.log(a, b, c);

    // let {foo,bar,baz} = $inject;  / $injections

    console.log('yyy => ', yyy);
    console.log('zzz => ', zzz);
    console.log('zaul => ', zaul);
    console.log('raul => ', raul);

    before('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (b1) !');
      })

    });

    before('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (b2) !');
      });

    });

    before('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (b3) !');
      });

    });
  });

  describe('inner', function (it) {

    it('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (1) !');
      })

    });

    it('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (2) !');
      });

    });

    it('makes testing fun', t => {

      t.on('done', function () {
        console.log('t is done (3) !');
      });

    });
  });

});

