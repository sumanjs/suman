'use strict';

/**
 * Created by denman on 1/1/2016.
 */

var suman = require('../../lib/index');

var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida'],
    interface: 'BDD',
    iocData: createIOCArgs()
});

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
    };
}

Test.describe('gggg', { parallel: false }, function (http, assert, delay, fs, child_process, socketio, suite, whoa, cherry, https) {

    setTimeout(function () {
        delay();
    }, 100);

    this.beforeEach(function (t) {});

    this.it('makes noise', {}, function () {});

    this.context('moodle', { parallel: false }, function () {

        this.before.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _context.next = 2;
                            return new Promise(function (resolve) {
                                setTimeout(function () {
                                    resolve('dude');
                                });
                            });

                        case 2:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });

    this.describe('moodle', { parallel: true }, function () {

        this.beforeEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.beforeEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        }).beforeEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it.cb('mmm1', { parallel: false }, function (t, done) {

            setTimeout(function () {
                done();
            }, 50);
        }).it.cb('mmm2', { parallel: false }, function (t) {

            setTimeout(function () {
                t.done();
            }, 50);
        }).it.cb('mmm3', { parallel: false }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.beforeEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.afterEach.cb(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.afterEach.cb(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.after(function () {});
    });

    this.describe('bum', { parallel: false }, function () {

        this.describe('x', function () {

            this.describe('y', function () {
                this.it('ddd', {
                    parallel: false
                }, function (t, done) {
                    setTimeout(function () {
                        done();
                    }, 50);
                });
            });

            this.it('cccc', {
                parallel: false
            }, function (t, done) {
                setTimeout(function () {
                    done();
                }, 50);
            });
        });

        this.it('aaa1', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('aaa2', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('aaa3', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('aaa4', {
            parallel: false
        }, function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.after(function () {});
    });

    this.after(function () {});
});