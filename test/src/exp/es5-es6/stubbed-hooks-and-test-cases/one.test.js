const suman = require('suman');
const Test = suman.init(module,{
  __expectedExitCode: 0
});


Test.create('Stubbed test cases', function (assert, fs, http, os, it) {

  it('is great');
  it.only('is great');
  it('is great');
  it('is great');

});




