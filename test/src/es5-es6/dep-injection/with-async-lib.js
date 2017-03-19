const suman = require('suman');
const Test = suman.init(module, {});

Test.create('example', function (before, describe, inject, async) {

  function run(a, cb) {
    setTimeout(function () {
      cb(null, a);
    }, 100);
  }

  Function.prototype.adhere = function () {

    let self = this;
    let args1 = Array.from(arguments);

    return function () {

      let args2 = Array.from(arguments);
      self.apply(this, args1.concat(args2));
    }

  };

  inject.cb('yyy', i => {

    async.parallel({
      foo: run.adhere('foo'),
      bar: run.adhere('bar'),
      baz: run.adhere('baz')
    }, i);

  });

  inject.cb('zzz',i => {
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


  describe('inner-hooks', function (before, yyy, zzz, zaul, raul) {

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

