const suman = require('suman');
const Test = suman.init(module, {});

Test.create({parallel: true}, function () {

  this.beforeEach.cb(t => {
    setTimeout(function () {
      console.log('before each ' + t.desc);
      t.done();
    }, 100);
  });

  this.it.cb('val', {}, t => {

    setTimeout(function () {
      t.done(); ////////
    }, 1000);

  });

  this.it.cb('foo', t => {

    setTimeout(function () {
      t.done();
    }, 1000);
  });

  this.it.cb('zam', t => {

    setTimeout(function () {
      t.done();
    }, 1000);
  });

});
