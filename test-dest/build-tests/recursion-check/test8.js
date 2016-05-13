'use strict';

/**
 * Created by denman on 1/1/2016.
 */

var Test = require('../../../lib').init(module, {
    export: false, //module.exports.wait = false;
    integrants: []
});

Test.describe('gggg', { parallel: true }, function () {

    this.beforeEach(function (t, done) {
        done();
    });

    this.after(function (done) {
        done();
    });

    this.after(function (done) {
        done();
    });

    this.describe('sharks', function () {

        this.after(function (done) {
            done();
        });

        this.beforeEach(function (t, done) {
            done();
        });

        this.describe('pre-moodle', function () {

            this.it('is async', function (done) {

                setTimeout(function () {
                    done();
                }, 1000);
            });
        });

        this.describe('moodle', {
            parallel: true
        }, function () {

            this.after(function (done) {
                done();
            });

            this.beforeEach(function (t, done) {
                done();
            });

            this.it('mmm1', { parallel: false }, function (t, done) {

                done();
            }).it('mmm2', { parallel: false }, function (t, done) {
                done();
            }).it('mmm3', { parallel: false }, function (t, done) {

                // throw new Error('Whoa');  //TODO: fatal error throws off logs
                done();
            });

            this.beforeEach(function (t, done) {

                done();
            });

            this.afterEach(function (t, done) {

                done();
            });

            this.after(function (done) {
                done();
            });
        });

        this.after(function (done) {
            done();
        });
    });

    this.before(function (done) {
        done();
    });

    this.it('7779999', { parallel: false, delay: 100 }, function (t) {

        return new Promise(function (resolve) {
            resolve('0');
        });
    });

    this.after(function (done) {
        done();
    });
});