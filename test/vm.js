const suman = require('suman');//
const Test = suman.init(module);

Test.create('A', function (it, beforeEach, assert, describe, after) {

  describe('B', function () {

    it.cb('1', t => {
      setTimeout(t, 3000);
    });

    after(h => {
      console.log('after 1');
    });

    describe('C', function () {

      it.cb('2', t => {
        setTimeout(t, 2000);
      });

      after(h => {
        console.log('after 2');
      });

      describe('D', function () {

        after(h => {
          console.log('after 3');
        });

        it.cb('3', t => {
          setTimeout(t, 1000);
        });

      });

    });

  });

});

