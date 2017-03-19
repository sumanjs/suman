const suman = require('suman');
const Test = suman.init(module, {
  $inject: ['abc']
});


Test.create(['parallel: true', 'parallel: true',
  function (assert, before, beforeEach, it, after) {

  console.log(this.opts);

  before({fatal: false}, t => {
    throw new Error('hook');
  });

  before(t => {
    console.log('before a');
  });

  beforeEach.cb({}, t => {
    console.log('before each starting...');
    setTimeout(function () {
      console.log('before each hook finished.');
      t.ctn();
    }, 1000);

  });

  it('a', t => {
    assert(true);
  });


  after(t => {
    console.log('after a');
  });


  this.describe('nested group 1', {parallel: true}, function () {

    this.before(t => {
      console.log('before b');
    });

    this.it('b', t => {
      assert(true);
    });


    this.after(t => {
      console.log('after b');
    });


    this.describe('nested group 2', {parallel: true}, function () {

      this.before(t => {
        console.log('before c & d');
      });

      this.beforeEach(t => {
        console.log('before each of c & d');
      });

      this.it('c', t => {
        console.log('test passed');
        assert(true);
      });


      this.it('d', t => {
        assert(true);
      });


      this.after(t => {
        console.log('after c & d');
      });

    });


  });

}]);
