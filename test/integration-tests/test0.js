
const suman = require('suman');

const Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida'],
    interface: 'BDD',
    iocData: createIOCArgs()
});

////////

function createIOCArgs() {

    return {
        roodles: {
            camera: 'man'
        },
        whoa: {
            bob: 'bouche'
        },
        cherry: {
            'wrong': 'number'
        }
    }
}


Test.describe('gggg', {parallel: false},
    function (http, assert, delay, fs, child_process, socketio, suite, whoa, cherry, https) {


    setTimeout(function () {
        delay();
    }, 100);


    this.beforeEach(function (t) {

    });

    this.it('makes noise', {}, function () {

    });


    this.context('moodle', {parallel: false}, function () {

        this.before.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);

        });

        this.before.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.before.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.before(function *() {
            yield new Promise(function (resolve) {
                setTimeout(function () {
                    resolve('dude');
                });
            });
        });
    });


    this.describe('moodle', {parallel: true}, function () {


        this.beforeEach.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.beforeEach.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        }).beforeEach.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.it.cb('mmm1', {parallel: false}, t => {

            setTimeout(function () {
                t.done();
            }, 50);

        }).it.cb('mmm2', {parallel: false}, (t) => {

            setTimeout(function () {
                t.done();
            }, 50);

        }).it.cb('mmm3', {parallel: false}, t => {
            setTimeout(function () {
                t.done();
            }, 50);

        });

        this.beforeEach.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.afterEach.cb(t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.afterEach.cb(t => {
            setTimeout(function () {

                t.done();
            }, 50);
        });

        this.after(function () {

        });

    });


    this.describe('bum', {parallel: false}, function () {

        this.describe('x', function () {


            this.describe('y', function () {

                this.it('ddd', {parallel: false}, t => {
                    setTimeout(function () {
                        t.done();
                    }, 50);
                });

            });


            this.it('cccc', {parallel: false}, t => {
                setTimeout(function () {
                    t.done();
                }, 50);
            });
        });


        this.it('aaa1', {
            parallel: false
        }, t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });
//

        this.it('aaa2', {
            parallel: false
        }, t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });


        this.it('aaa3', {
            parallel: false
        }, t => {
            setTimeout(function () {
                t.done();
            }, 50);
        });

        this.it('aaa4', {
            parallel: false
        }, t => {
            setTimeout(function () {
                t.done();
            }, 50);

        });

        this.after(function () {

        });

    });


    this.after(function () {

    });

});
