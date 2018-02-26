const suman = require('suman');

const Test = suman.init(module, {
  // export: false,
  interface: 'TDD'
});

Test.create('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, test) {

  test('a', t => {
    console.log(t.desc);
  });

});

Test.create('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, test) {

  test('a', t => {
    console.log(t.desc);
  });

});

Test.create('@Test1', {parallel: false}, function (assert, fs, path, stream, suite, test) {

  test('a', t => {
    console.log(t.desc);
  });

});

