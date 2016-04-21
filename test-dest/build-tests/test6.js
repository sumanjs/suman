'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suman = require('../../lib');
var Test = suman.init(module, {
    interface: 'TDD'
});

function promiseTimeout() {
    return new _promise2.default(function (resolve) {
        setTimeout(function () {
            resolve(3);
        }, 100);
    });
}

Test.suite('@Test1-TDD', { parallel: false, bail: true }, function () {

    this.setupTest(function () {});

    this.teardownTest(function () {});

    this.setup(function () {});

    this.teardown(function () {});

    this.test('one', function (t) {
        return promiseTimeout(t);
    });

    this.suite.skip('hello', {}, function () {

        this.test('two');

        this.test('three', function (t) {
            return promiseTimeout(t);
        });

        this.test('four', function (t) {
            return promiseTimeout(t);
        });

        this.test('five', function (t) {
            throw new Error('fools');
            return promiseTimeout(t);
        });

        this.suite(function () {

            this.test('four', function (t) {
                return promiseTimeout(t);
            });

            this.test('five', function (t) {
                return promiseTimeout(t);
            });
        });
    });
});