

const suman = require('suman');

const Test = suman.init(module, {
  pre: ['dog'],
  integrants: ['dog']
});

Test.create('hotels', function(it){

  it('is cool');

});
