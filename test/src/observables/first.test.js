const suman = require('suman');
const Test = suman.init(module, {});


const Rx = require('rxjs');


function suppress() {
    return Rx.Observable.create(sub => {
        sub.complete();
    });
}


Rx.Observable.prototype.suppress = function () {

    const source = this;

    return Rx.Observable.create(sub => {

       return source.subscribe(
            function onNext(v){

            },
            function onError(e){
                console.log(e.stack || e);
            },
            function onComplete(){
                sub.complete();
            }
        )
    });

};


Test.create(__filename, {parallel:true}, function (assert) {


    this.it('completes [a]', t => {

        return Rx.Observable.interval(100)
            .take(5)
            .flatMap($ => suppress())

    });

    this.it('completes [b]', t => {

        return Rx.Observable.interval(100)
            .take(5)
            .flatMap($ => suppress())
            .subscribe()

    });

    this.it('completes [c]', t => {

        return Rx.Observable.interval(100)
            .take(5)
            .suppress()

    });

    this.it('completes [d]', t => {

        return Rx.Observable.interval(100)
            .take(5)
            .suppress()
            .subscribe()


    });
});
