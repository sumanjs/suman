/**
 * Created by denman on 2/9/16.
 */

"use strict";

function _asyncToGenerator(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(function (value) {
                        return step("next", value);
                    }, function (err) {
                        return step("throw", err);
                    });
                }
            }

            return step("next");
        });
    };
}

var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.describe('B', ['socketio', 'request', 'delay'], function (socketio, request, delay, roodles, choodles) {

    console.log('roodles:', roodles);
    console.log('choodles:', choodles);

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
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(charlie || 'yikes');
            }, 100);
        });
    }

    //this.before(async function () {
    //    return await timeout();
    //});

    this.beforeEach(function () {
        var ref = _asyncToGenerator(function* (t) {
            console.log('TTTTTTT:', t);
            //t.data.lion = await timeout();
        });

        return function (_x) {
            console.log('XXXX:', _x);
            return ref.apply(this, arguments);
        };
    }());

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

            arr.forEach(item => {

                this.it('[test]' + item, function (t) {
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

            setTimeout(function () {
                arr.push(13);
                delay();
            }, 100);

            arr.forEach(item => {

                this.it('[test]' + item, function (t) {
                    console.log('C => ' + t.desc);
                });
            });

            this.describe('D', function () {

                arr.forEach(item => {

                    this.it('[test]' + item, function (t) {
                        console.log('D => ' + t.desc);
                    });
                });
            });
        });
    });
});