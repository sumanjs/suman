const suman = require('suman');
const Test = suman.init(module, {
  __expectedExitCode: 66
});

Test.create('Stubbed test cases', function (assert, fs, http, os, it) {

  throw 'my favorite fail lol'

});
