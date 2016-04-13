'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suman = require('../../lib');
var Test = suman.init(module, {});

Test.describe('Zulu', { mode: 'series' }, function () {

    this.beforeEach(function (t) {
        console.log('before each ' + t.desc);
    });

    this.it('val', {});

    this.it('foo');

    this.describe.skip('A', { parallel: true }, function () {

        this.before(_regenerator2.default.mark(function _callee() {
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            console.log('before ', this.desc);

                        case 1:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        this.beforeEach(_regenerator2.default.mark(function _callee2(t) {
            return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            console.log('before each ' + t.desc);

                        case 1:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 800);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 800);
        });

        this.after(function () {
            console.log('after 1');
        });
    });

    this.describe('Z', function () {

        this.it('Z1', function () {});
    });

    this.describe('B', { parallel: true }, function () {

        this.before(function () {
            console.log('before ', this.desc);
        });

        this.it.SKIP(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });

        this.it.SKIP(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });
    });

    this.describe('C', { parallel: true }, function () {

        this.before(function () {
            console.log('before ', this.desc);
        });

        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 300);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 300);
        });

        this.describe.skip('M', { parallel: true }, function () {

            this.before(function () {
                console.log('before ', this.desc);
            });

            this.it(this.desc + '1', function (t, done) {
                setTimeout(function () {
                    done();
                }, 500);
            });

            this.it(this.desc + '2', function (t, done) {
                setTimeout(function () {
                    done();
                }, 500);
            });

            this.describe.skip('O', { parallel: true }, function () {

                this.before(function () {
                    console.log('before ', this.desc);
                });

                this.it(this.desc + '1', function (t, done) {
                    setTimeout(function () {
                        done();
                    }, 500);
                });

                this.it(this.desc + '2', function (t, done) {
                    setTimeout(function () {
                        done();
                    }, 500);
                });

                this.describe.skip('P', { parallel: true }, function () {

                    this.before(function () {
                        console.log('before ', this.desc);
                    });

                    this.it(this.desc + '1', function (t, done) {
                        setTimeout(function () {
                            done();
                        }, 500);
                    });

                    this.it(this.desc + '2', function (t, done) {
                        setTimeout(function () {
                            done();
                        }, 500);
                    });
                });
            });
        });
    });

    this.describe('D', { parallel: true }, function () {

        this.before(function () {
            console.log('before ', this.desc);
        });

        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 100);
        });

        this.it.skip(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 100);
        });
    });
});