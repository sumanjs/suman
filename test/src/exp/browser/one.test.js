/* globals suman */

const Test = suman.init(module, {
    $inject: ['abc'],
    pre: []
  },
  {
    allowArrowFunctionsForTestBlocks: true
  });

Test.create(['parallel: false', (before, beforeEach, it, after, describe) => {

  before({fatal: false}, t => {
    throw new Error('hook');
  });

  before(t => {
    console.log('before a');
  });

  // beforeEach.cb({}, t => {
  //   console.log('before each starting...');
  //   setTimeout(function () {
  //     console.log('before each hook finished.');
  //     t.ctn();
  //   }, 10);
  // });

  beforeEach.cb({}, t => {
    console.log('before each starting...');
    console.log('before each hook finished.');
    t.ctn();
  });

  ///////////////////

  it('a', t => {
    // assert(true);
  });

  after(t => {
    console.log('after a');
  });

  Number(5).times(num => {

    console.log('laughing...');

    describe('nested group 1', {parallel: false}, function () {

      this.before(t => {
        console.log('before b');
      });

      this.it('b', t => {
        // assert(true);
      });

      this.after(t => {
        console.log('after b');
      });

      this.describe('nested group 2', {parallel: false}, function () {

        this.before(t => {
          console.log('before c & d');
        });

        this.beforeEach(t => {
          console.log('before each of c & d');
        });

        this.it('d', t => {
          // assert(true);
        });

        this.it('c', t => {
          console.log('test passed');
          // assert(true);
        });

        this.after(t => {
          console.log('after c & d');
        });

      });

    });

  });

}]);
