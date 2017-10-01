const suman = require('suman');
const Test = suman.init(module);

//project
const _suman = global.__suman = (global.__suman || {});

Test.create(function (it, context, after) {

  after.last(function(){
    console.log('after last 1');
  });

  after.last(function(){
    console.log('after last 2');
  });

  after(function(){
    console.log('after');
  });


  context('colors', () => {

    context('red', function () {

      it('bbbbb');

      it('kppppp', ['skipped:true']);

      it('success', t => {
        throw 'dog'
      });
    });

    context('blue', function () {

      it('bbbbb');

      it('kppppp', ['skipped:true']);

      it('success', t => {

      });
    });

    context('yellow', function () {

      it('bbbbb');

      it('kppppp', ['skipped:true']);

      it('success', t => {

      });
    });

  });

});
