const suman = require('suman');
const Test = suman.init(module, {});

const {Observable} = require('rxjs');

function suppress() {
  return Observable.create(sub => sub.complete());
}

Observable.prototype.suppress = function () {

  const source = this;

  return Observable.create(sub => {

    return source.subscribe(
      function onNext(v) {

      },
      function onError(e) {
        console.log(e.stack || e);
      },
      function onComplete() {
        sub.complete();
      }
    )
  });

};

Test.create({parallel: true}, function (assert, it) {

  it('completes [a]', t => {

    return Observable.interval(100)
    .take(5)
    .flatMap($ => suppress())

  });

  it('completes [b]', t => {

    return Observable.interval(100)
    .take(5)
    .flatMap($ => suppress())
    .subscribe()

  });

  it('completes [c]', t => {

    return Observable.interval(100)
    .take(5)
    .suppress()

  });

  it('completes [d]', t => {

    return Observable.interval(100)
    .take(5)
    .suppress()
    .subscribe()

  });
});
