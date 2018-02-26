'use strict';

const suman = require('suman');

const Test = suman.init(module, {
  pre: ['cat', 'mouse', 'dog'],
  post: ['smartconnect']
});

Test.create('hotels', function (b, it, before, beforeEach, context, afterAllParentHooks, sheep, function_arguments) {


  let foo;
  {
    let v = 2;
    foo = v * 2;
  }

  console.log(foo); /////////////

  beforeEach(t => {
    console.log('parent before each');
  });

  b.set('x', {zoom: {val: 5}});

  context('foo', function (b) {

    // b.get('x').zoom.zz = 7;
    console.log('this.shared boof', b.get());

    context('foo', function (b) {

      // b.get('x').zoom.zz = 7;
      b.set('x', 'babababa');

    });
  });

  it.cb('is cool story bro', t => {
    setTimeout(function () {
      t.done(null)
    }, 1000);
  });

  it('is cool story bro 2', t => {

    setTimeout(function(){
      // throw Error('radical');
    },10);

  });

  context('zoo', function (b) {
    console.log('this.shared real', b.get());
  });

});

//////

Test.create('hotels', function (b,it, before, beforeEach, context, afterAllParentHooks) {

  let foo;
  {
    let v = 2;
    foo = v * 2;
  }

  console.log(foo); //

  beforeEach(t => {
    console.log('parent before each');
  });

  b.set('x', {zoom: {val: 5}});

  before(t => {
    console.log('parent before');
  });

  context('foo', function (b) {

    // b.get('x').zoom.zz = 7;
    console.log('this.shared boof', b.get());

    context('foo', function (b) {

      // b.get('x').zoom.zz = 7;
      b.set('x', 'babababa');
      it('is cool story bro 1', suman.autoPass);
      // it.cb('is cool story bro 2', t => {
      //   setTimeout(function () {
      //     throw 'fail whale';
      //   }, 1000);
      // });

    });
  });

  context('zoo', function (b) {

    console.log('this.shared real', b.get());

  });

});

