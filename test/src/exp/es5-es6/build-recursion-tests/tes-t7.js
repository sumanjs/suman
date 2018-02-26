/**
 * Created by denman on 1/2/2016.
 */



const Test = require('suman').init(module, {
  export: false,
  integrants: ['smartconnect', 'dolce-vida'],
  override: {
    options: {
      allowSkip: true
    }
  },
  iocData: {  //we pass this data to ioc file
    choodles: function () {

    }
  }
} ,{
  allowSkip: true
}, {

});

Test.create('Suite7', {parallel: true}, function (b, before, it, describe, fs, choodles, request, assert) {

  before.cb(t => {
    t.ctn();
  });

  it('blue1', function* (t) {
    yield 3;
    yield 4;
    yield 5;
  });

  it('blue2', function* (t) {
    yield 3;
    yield 4;
    yield 5;
    yield 3;
    yield 4;
    yield 5;
    yield 3;
    yield 4;
    yield 5;
    yield 3;
    yield 4;
    yield 5;
  });

  it('yes', {}, function* ageage(t) {

    const five = yield 5;
    const res = yield new Promise(function (resolve) {
      resolve(five);
    });

    const val = yield new Promise(function (resolve, reject) {

      setTimeout(function () {
        resolve();
      }, 100);

    })
    .then(function () {

      return new Promise(function (resolve, reject) {

        setTimeout(t.wrap(function () {
          resolve(5);
        }), 100);

      });

    });
    assert.equal(val, 5);

  });

  it.cb('[test] yo 1', {parallel: true}, t => {

    fs.createReadStream('/dev/null')
    .pipe(fs.createWriteStream('/dev/null'))
    .on('error', t.fail).on('finish', t.pass);

  });

  it('has one', function () {

  });

  describe('loop', function (b) {

    [1, 2, 3, 4, 5, 6].forEach(val => {

      it.cb('tests ' + val, {parallel: !!val}, function (t) {

        // assert(false);
        //this.should.have.property('name', 'tj');

        t.pass();

      });
    });

  });

  describe.skip('1', function (b, it, before) {

    before.cb(t => {

      setTimeout(function () {
        t.done();
      }, 10);

    });

    it('[test] yo 2', {parallel: false}, t => {

      return new Promise(function (resolve, reject) {

        setTimeout(function () {
          resolve();
        }, 100);

      }).then(function () {

        return new Promise(function (resolve, reject) {

          setTimeout(t.wrap(function () {
            resolve();
          }), 100);

        });

      });

    });

    //this.it('[test] yo 2', {parallel: false}, new Promise(function (resolve, reject) {
    //
    //    Promise.delay(1000).then(function () {
    //        resolve();
    //    });
    //
    //}).then(function(){
    //
    //
    //
    //}));

    function p(val) {
      return new Promise(function (resolve) {
        resolve('doooog' + val);
      });
    }

    it('[test] gen', {parallel: false}, function* (t) {

      var val = yield p();
      val = yield p(val);

    });

    it.cb('yo', {parallel: false}, t => {

      // throw new Error('PAsta');
      setTimeout(function () {

        t.done();
      }, 100);

    });

    it.cb('chubs', {parallel: false, plan: 2}, t => {
      t.confirm();
      setTimeout(function () {
        t.confirm();
        t.done();
      }, 100);

    });

  });

});

