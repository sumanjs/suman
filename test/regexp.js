'use strict';

const suman = require('suman');

const Test = suman.init(module, {
  pre: ['dog'],
  integrants: ['dog'],
  post: ['smartconnect']
});

Test.create('hotels', function (it, before, beforeEach, context, afterAllParentHooks, $project) {

  console.log($project);

  // beforeEach(t => {
  //   console.log('parent before each');
  //   console.log('before each hook',t.shared.get('x'));
  // });

  before(t => {
    console.log('parent before');
    this.shared.set('x', 2);
  });

  context('foo', function () {

    console.log('this.shared.x => ', this.shared);

    before(t => {
      console.log('child 1 before');
    });

    beforeEach(t => {
      console.log('child 1 before each');
    });

  });

  context('zoo', function () {

    before(t => {
      console.log('child 2 before');
    });

    afterAllParentHooks('yes', t => {
      console.log('after all parent hooks');
    });

    beforeEach(t => {
      console.log('child 2 before each');
    });

    it('is cool', t => {
      console.log('yolo');

    });

  });

});
