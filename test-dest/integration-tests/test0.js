'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denman on 1/1/2016.
 */

var suman = require('../../lib');

var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida']
});

console.log('some bs');

Test.describe('gggg', { parallel: false }, function (http, delay, assert, fs, child_process, socketio, suite, whoa, cherry, https) {

    //console.log('child_process:',child_process);
    //console.log('http:',http);
    //console.log('https:',https);
    //console.log('cherry:', cherry);
    //console.log('whoa:', whoa);
    //console.log('suite:',suite);
    //console.log('fs:',fs);
    //console.log('assert:',assert);

    setTimeout(function () {
        delay();
    }, 100);

    this.it('makes noise', {}, function () {});

    this.context('moodle', { parallel: false }, function () {

        this.before(function (done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(function (done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(function (done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.before(_regenerator2.default.mark(function _callee() {
            var val;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _context.next = 2;
                            return new _promise2.default(function (resolve) {
                                setTimeout(function () {
                                    resolve('dude');
                                });
                            });

                        case 2:
                            val = _context.sent;
                            return _context.abrupt('return', console.log('val:', val));

                        case 4:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));
    });

    this.describe('moodle', { parallel: true }, function () {

        this.beforeEach(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        }).beforeEach(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        }).beforeEach(function (t, done) {
            setTimeout(function () {
                done();
            }, 50);
        });

        this.it('mmm1', { parallel: false }, function (t, done) {

            setTimeout(function () {
                done();
            }, 50);
        }).it('mmm2', { parallel: false }, function (t, done) {

            setTimeout(function () {
                done();
            }, 50);
        }).it('mmm3', { parallel: false }, function (done, t) {

            setTimeout(function () {
                done();
            }, 50);
        });

        this.beforeEach(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
            setTimeout(function () {

                done();
            }, 50);
        });

        this.afterEach(function (t, done) {
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