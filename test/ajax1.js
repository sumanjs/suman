'use strict';

const suman = require('suman');

const Test = suman.init(module, {
  pre: ['dog'],
  integrants: ['dog'],
  post: ['smartconnect']
});

Test.create('hotels', function (it, before, beforeEach, context, afterAllParentHooks) {

  let foo;
  {
    let v = 2;
    foo = v * 2;
  }

  console.log(foo); ///////////

  beforeEach(t => {
    console.log('parent before each');
  });

  this.shared.set('x', {zoom: {val: 5}});

  before(t => {
    console.log('parent before');
  });

  context('foo', function ($suite) {

    // this.shared.get('x').zoom.zz = 7;
    console.log('this.shared boof', this.shared.getAll());

    context('foo', function () {

      // this.shared.get('x').zoom.zz = 7;
      this.shared.set('x', 'babababa');

    });
  });

  it('is cool story bro');
  it.skip('is cool story bro');

  context('zoo', function () {

    console.log('this.shared real', this.shared.getAll());

  });

});

Test.create('hotels', function (it, before, beforeEach, context, afterAllParentHooks) {

  let foo;
  {
    let v = 2;
    foo = v * 2;
  }

  console.log(foo);

  beforeEach(t => {
    console.log('parent before each');
  });

  this.shared.set('x', {zoom: {val: 5}});

  before(t => {
    console.log('parent before');
  });

  context('foo', function ($suite) {

    // this.shared.get('x').zoom.zz = 7;
    console.log('this.shared boof', this.shared.getAll());

    context('foo', function () {

      // this.shared.get('x').zoom.zz = 7;
      this.shared.set('x', 'babababa');

    });
  });

  context('zoo', function () {

    console.log('this.shared real', this.shared.getAll());

  });

});

