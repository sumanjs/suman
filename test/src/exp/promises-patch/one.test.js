const then = Promise.prototype.then;
Promise.prototype.then = function (fn1, fn2) {

  if (process.domain) {
    fn1 = fn1 && process.domain.bind(fn1);
    fn2 = fn2 && process.domain.bind(fn2);
  }

  console.log('fn2 => ', fn2);

  return then.call(this, fn1, fn2);
};

process.on('uncaughtException', function (err) {
  console.log(' This is uncaught => ', err);
});

const domain = require('domain');

const d = domain.create();

d.on('error', function (err) {
  console.error(' => Domain caught => ', err);
});

d.run(function () {

  Promise.resolve().then(function () {
    process.nextTick(function () {
      throw new Error('rah');
    });
  });

});
