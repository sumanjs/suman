

const suman = require('suman');
const Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida'],
    post: ['ugly'],
    interface: 'BDD',
    iocData: createIOCArgs()
});

////////////////////

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

Test.describe.delay('gggg', {parallel: false},
    function (http, assert, fs, child_process, socket_io_client, suite, whoa, cherry, https) {

        setTimeout(() => {
            this.resume(5);
        }, 1000);

        this.beforeEach(function (t) {

        });

        this.it('makes noise', {}, function () {

        });

        this.context.delay('moodle', {parallel: false}, function () {

            const val = this.getResumeValue();

            this.resume();

            console.log('val:',val);

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

                    this.it.cb('ddd', {parallel: false}, t => {
                        setTimeout(t.done(), 50);
                    });

                });

                this.it.cb('cccc', {parallel: false}, t => {
                    setTimeout(t.done, 50);
                });
            });

            this.it.cb('aaa1', {
                parallel: false
            }, t => {
                setTimeout(t.done(), 50);
            });

            this.it.cb('aaa2', {
                parallel: false
            }, t => {
                setTimeout(t.done(), 50);
            });

            this.it.cb('aaa3', {
                parallel: false
            }, t => {
                setTimeout(t.done(), 50);
            });

            this.it.cb('aaa4', {
                parallel: false
            }, t => {
                setTimeout(t.done, 50);
            });

            this.after(function () {

            });

        });

        this.after(function () {

        });

    });
