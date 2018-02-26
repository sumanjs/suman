const suman = require('suman');  //using npm link
const Test = suman.init(module, {
  interface: 'TDD'
});

function promiseTimeout(val) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, val * 3), 100);
  });
}

Test.create('@Test1-EMpty', {parallel: false}, function (b, suite, test, assert, william) {

  console.log('william:', william);

  test('passes right away', function* () {
    // var val = yield promiseTimeout(yield promiseTimeout(4));
    // console.log('val:',val);
    assert.equal(36, yield promiseTimeout(yield promiseTimeout(4)));
  });

  test('fails right away', {throws: /chuck/}, function () {
    throw new Error('chuck');
  });

  test('fails right away', {throws: /bar/}, function () {
    throw new Error('foo');
  });

  test('should never run if bail is set to true', function () {
    assert(true);
  });

  suite('yo', function (b, setup) {

    setup('a', function () {

    });

  });
});
