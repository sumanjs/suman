

const suman = require('suman');

const Test = suman.init(module, {
  pre: ['dog'],
  integrants: ['dog'],
  post: ['smartconnect']
});

Test.create('hotels', function(it){

  it('is cool');

  it('is cool', t => {
     console.log('yolo');
  });

});
