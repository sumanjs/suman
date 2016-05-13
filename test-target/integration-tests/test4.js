'use strict';

/**
 * Created by denman on 2/7/2016.
 */

var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('A2', ['delay'], function (delay) {
    var _this = this;

    var arr = [1, 2];

    setTimeout(function () {
        arr.push(4);
        delay();
    }, 100);

    arr.forEach(function (item) {

        _this.it('[test]' + item, function (t) {
            console.log('A => ' + t.desc);
        });
    });

    this.before.cb(function (t) {
        setTimeout(function () {
            t.done();
        }, 100);
    });

    this.describe('B', function (delay) {
        var _this2 = this;

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        arr.forEach(function (item) {

            _this2.it('[test]' + item, function (t) {
                console.log('B1 => ' + t.desc);
            });
        });

        this.describe(function () {
            var _this3 = this;

            arr.forEach(function (item) {

                _this3.it('[test]' + item, function (t) {
                    console.log('B2 => ' + t.desc);
                });
            });
        });
    });

    this.describe('C', function (delay) {

        setTimeout(function () {
            arr.push(9);
            delay();
        }, 100);

        this.describe('j', function (delay) {
            var _this4 = this;

            setTimeout(function () {
                arr.push(13);
                delay();
            }, 100);

            arr.forEach(function (item) {

                _this4.it('[test]' + item, function (t) {
                    console.log('C => ' + t.desc);
                });
            });

            this.describe('D', function () {
                var _this5 = this;

                arr.forEach(function (item) {

                    _this5.it('[test]' + item, function (t) {
                        console.log('D => ' + t.desc);
                    });
                });
            });
        });
    });
});