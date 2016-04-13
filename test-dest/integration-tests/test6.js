/**
 * Created by denman on 2/9/16.
 */

"use strict";

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suman = require('../../lib');
var Test = suman.init(module, 'suman.conf.js');

Test.describe('B', ['socketio'], function (socketio, request, delay, roodles, choodles, fs) {

    // console.log('roodles:', roodles);
    // console.log('choodles:', choodles);
    //
    // console.log('fs:', fs);

    var arr = [1, 2, 3];

    setTimeout(function () {
        arr.push(4);
        arr.push(5);
        arr.push(6);
        delay();
    }, 100);

    this.before(function (done) {

        setTimeout(function () {
            //console.log('BEFORE');
            done();
        }, 100);
    });

    function timeout(charlie) {
        return new _promise2.default(function (resolve) {
            setTimeout(function () {
                resolve(charlie || 'yikes');
            }, 100);
        });
    }

    //this.before(async function () {
    //    return await timeout();
    //});

    this.beforeEach(function (t, done, run) {
        // console.log('TTTTTTT:', t);
        // console.log('DDDDD:', done);
        // console.log('RRRRR:', run);
        done();
        //t.data.lion = await timeout();
    });

    this.beforeEach(function (t) {
        t.data.lion = 'barb';
    });

    this.beforeEach(function (t, done) {

        setTimeout(function () {
            //console.log('BEFORE EACH');
            done();
        }, 100);
    });

    this.describe('B', function (delay) {

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        this.describe(function () {
            var _this = this;

            arr.forEach(function (item) {

                _this.it('[test]' + item, function (t) {
                    console.log('B => ' + t.desc, t.data.lion);
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