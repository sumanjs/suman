/**
 * Created by amills001c on 2/9/16.
 */


"use strict";

var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.describe('B', ['socket.io', 'request', 'delay', 'roodles', 'choodles'], function (socketio, request, delay, roodles, choodles) {


    var arr = [1, 2, 3];

    setTimeout(function () {
        arr.push(4);
        arr.push(5);
        arr.push(6);
        delay();
    }, 100);


    this.before(function (done) {

        setTimeout(function () {
            console.log('BEFORE');
            done();
        }, 100);

    });

    function timeout(charlie) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(charlie || 'yikes');
            }, 100);
        })
    }


    this.before(async function () {
        return await timeout();
    });


    this.beforeEach(async function (t) {
        t.data.lion = await timeout();
    });


    this.beforeEach(function (t, done) {

        setTimeout(function () {
            console.log('BEFORE EACH');
            done();
        }, 100);

    });

    this.describe('B', function (delay) {

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        this.describe(function () {

            arr.forEach((item)=> {

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

            arr.forEach((item)=> {

                this.it('[test]' + item, function (t) {
                    console.log('C => ' + t.desc);
                });

            });


            this.describe('D', function () {

                arr.forEach((item)=> {

                    this.it('[test]' + item, function (t) {
                        console.log('D => ' + t.desc);
                    });

                });

            });
        });

    });

});