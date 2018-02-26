const suman = require('suman');
const Test = suman.init(module);

Test.create((describe, it, context, before, after) => {

  describe('outer', b => {

    const time = {start: null};

    before('happens before', h => {
      time.start = Date.now();
    });

    after('happens after', h => {
      console.log('total time for describe:', Date.now() - time.start);  // want to print this for each describe block
    });

    describe('inner-1', b => {

    });

    describe('inner-2', b => {

    });

    describe('inner-3', b => {

    });

  });

});
