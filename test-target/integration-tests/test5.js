'use strict';

/**
 * Created by denman on 2/7/2016.
 */

var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('A', {}, function (request, socketio) {

    //console.log('request:', request.toString());
    //console.log('socketio:', socketio.toString());

    // throw new Error('shit');

    var arr = [1, 2, 3];

    setTimeout(function () {
        arr.push(4);
        arr.push(5);
        arr.push(6);
        //delay();
    }, 100);

    this.before.cb(function (t) {
        setTimeout(function () {
            t.done();
        }, 1000);
    });

    this.describe.SKIP('B', function (delay) {

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        this.describe('ruffles', function () {
            var _this = this;

            arr.forEach(function (item) {
                _this.it('[test]' + item, function (t) {
                    console.log('B => ' + t.desc);
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
            var _this2 = this;

            setTimeout(function () {
                arr.push(13);
                delay();
            }, 100);

            arr.forEach(function (item) {
                _this2.it('[test]' + item, function (t) {
                    console.log('C => ' + t.desc);
                });
            });

            this.describe('D', function () {
                var _this3 = this;

                arr.forEach(function (item) {
                    _this3.it('[test]' + item, function (t) {
                        console.log('D => ' + t.desc);
                    });
                });
            });
        });
    });
});