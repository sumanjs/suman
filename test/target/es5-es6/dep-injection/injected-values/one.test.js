'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suman = require('suman');
var Test = suman.init(module, {});

Test.create('example', function (before, describe, inject) {

    inject(function (t) {

        return {
            sam: _promise2.default.resolve(5)
        };
    });

    describe('inner-hooks', function (before, sam) {

        console.log('sam => ', sam);

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b1) !');
            });
        });

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b2) !');
            });
        });

        before('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (b3) !');
            });
        });
    });

    describe('inner', function (it) {

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (1) !');
            });
        });

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (2) !');
            });
        });

        it('makes testing fun', function (t) {

            t.on('done', function () {
                console.log('t is done (3) !');
            });
        });
    });
});