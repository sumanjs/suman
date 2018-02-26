#!/usr/bin/env node
'use strict';

const suman = require('suman');
const Test = suman.init(module, {
  $inject: ['abc']
});

Test.create(['parallel: true', (b, assert, before, beforeEach, it, after, describe) => {

  console.log('arguments => ', arguments);

  before(['fatal:false', t => {
    // throw new Error('hook');
  }]);

  before(t => {
    console.log('before a');
  });

  beforeEach.cb({}, t => {
    console.log('before each starting...');
    setTimeout(function () {
      console.log('before each hook finished.');
      t.ctn();
    }, 100);
  });


  it('a', t => {
    assert(true);
  });

  after(t => {
    console.log('after a');
  });

  after.cb.last.always(t => {
    console.log('after xxxx');
    t.done();
  });

  after.always.cb.last(t => {
    console.log('after yyy');
    t.done();
  });

  after.cb(t => {
    console.log('after ba');
    t.done();
  });

  // late registry of hook, should cause error
  // process.nextTick(function(){
  //   after(t => {
  //     console.log('after b');
  //   });
  // });

  Number(5).times(num => {

    describe('nested group 1', {parallel: true}, function (b) {

      before([t => {
        console.log('before b');
      }]);

      it('b', t => {
        assert(true);
      });

      Number(1).times(num => {
        describe('nested group 2', {parallel: true}, function (b) {

          before(t => {
            console.log('before c & d');
          });

          beforeEach(t => {
            console.log('before each of c & d');
          });

          it('d', t => {
            assert(true);
          });

          it('c', t => {
            console.log('test passed');
            assert(true);
          });

          after(t => {
            console.log('after c & d');
          });

        });

        Number(5).times(num => {
          describe('nested group 2', {parallel: true}, function (b) {

            before(t => {
              console.log('before c & d');
            });

            beforeEach(t => {
              console.log('before each of c & d');
            });

            it('d', t => {
              assert(true);
            });

            it('c', t => {
              console.log('test passed');
              assert(true);
            });

            after(t => {
              console.log('after c & d');
            });

          });

        });

      });

    });

  });

}]);
