const suman = require('suman');

const Test = suman.init(module, {
  export: true,
  interface: 'TDD'
});


Test.suite('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, extraArgs) {


  this.test('a', t => {
    console.log(t.desc);
  });


});


Test.suite('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, extraArgs) {


  this.test('a', t => {
    console.log(t.desc);
  });


});


Test.suite('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, extraArgs) {


  this.test('a', t => {
    console.log(t.desc);
  });


});

