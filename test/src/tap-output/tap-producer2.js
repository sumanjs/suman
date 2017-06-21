
const suman = require('suman');
const Test = suman.init(module);

Test.create(function(it){

  it('passes', t => {

  });

  it('fails', t => {
    throw 'this is a failure'
  });


});
