'use strict';

/**
 * Created by denman on 1/1/2016.
 */

var Test = require('../../../lib').init(module, {
    export: false, //module.exports.wait = false;
    integrants: []
});

Test.describe('gggg', { parallel: true }, function () {

    this.beforeEach.cb(function (t) {
        t.done();
    });

    this.after.cb(function (t) {
        t.done();
    });

    this.after.cb(function (t) {
        t.done();
    });

    this.describe('sharks', function () {

        this.after.cb(function (t) {
            t.done();
        });

        this.beforeEach.cb(function (t) {
            t.done();
        });

        this.describe('pre-moodle', function () {

            this.it('is async', function (t) {

                setTimeout(function () {
                    t.done();
                }, 1000);
            });
        });

        this.describe('moodle', { parallel: true }, function () {

            this.after.cb(function (t) {
                t.done();
            });

            this.beforeEach.cb(function (t) {
                t.done();
            });

            this.it.cb('mmm1', { parallel: false }, function (t) {

                t.done();
            }).it.cb('mmm2', { parallel: false }, function (t) {
                t.done();
            }).it.cb('mmm3', { parallel: false }, function (t) {

                // throw new Error('Whoa');  //TODO: fatal error throws off logs
                t.done();
            });

            this.beforeEach.cb(function (t) {

                t.done();
            });

            this.afterEach.cb(function (t) {

                t.done();
            });

            this.after.cb(function (t) {
                t.done();
            });
        });

        this.after.cb(function (t) {
            t.done();
        });
    });

    this.before.cb(function (t) {
        t.done();
    });

    this.it('7779999', { parallel: false, delay: 100 }, function (t) {

        return new Promise(function (resolve) {
            resolve('0');
        });
    });

    this.after.cb(function (t) {
        t.done();
    });
});