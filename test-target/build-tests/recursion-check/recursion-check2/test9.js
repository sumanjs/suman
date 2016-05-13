'use strict';

/**
 * Created by denman on 1/3/2016.
 */

var Test = require('../../../../lib').init(module, 'suman.conf.js');

Test.describe('A describe', { parallel: true }, function () {

    this.after.cb(function (t) {
        t.done();
    });

    this.describe('B describe', function () {

        this.after.cb(function (t) {
            t.done();
        });

        this.it('b1 test', { parallel: false }, function (t) {});

        this.it('b2 test', function () {});

        this.it('b3 test', function () {});

        this.it('b4 test', function () {});

        this.describe('C', function () {

            this.after.cb(function (t) {
                t.done();
            });
        });
    });

    this.describe('D describe', function () {

        this.after.cb(function (t) {
            t.done();
        });

        this.it('d1 test', function () {});

        this.it('d2 test', function () {});

        this.describe('E', function () {

            this.it('e1 test', function (t) {});

            this.it('e2 test', function (t) {});

            this.it('e3 test', function (t) {});

            this.after.cb(function (t) {
                t.done();
            });
        });
    });

    this.describe('F', function () {
        this.after.cb(function (t) {
            t.done();
        });

        this.describe('G', function () {

            this.it.cb('mmm2', { parallel: false }, function (t) {
                t.done();
            });

            this.after.cb(function (t) {
                t.done();
            });
        });
    });

    this.describe('moodle', { parallel: false }, function () {

        this.after.cb(function (t) {
            t.done();
        });

        this.it.cb('mmm1', { parallel: false }, function (t) {
            t.done();
        });

        this.after.cb.skip(function (t) {
            console.log('dingy');
            t.done();
        });
    });

    this.it.cb('a test', { parallel: false }, function (t) {
        t.done();
    });

    this.after.cb(function (t) {
        t.done();
    });

    this.after.cb(function (t) {
        t.done();
    });
});