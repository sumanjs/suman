'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denmanm1 on 4/9/16.
 */

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

Test.suite('@Test1-EMpty', { parallel: false, bail: true }, function () {

    this.test('passes right away', function () {});

    this.test('fails right away', function () {
        throw new Error('chuck');
    });

    this.test('should never run if bail is set to true', function () {});
});