'use strict';

/*
 * created by Olegzandr Denman
 *
 * */

//context
//gwt

var suman = require('../../lib');
var Test = suman.init(module, {
    integrants: ['smartconnect', 'dolce-vida']
});

Test.describe('suite uno', function () {

    this.it.skip('foo2', { parallel: true }, function (t) {});

    this.it.skip('bar2', { parallel: false }, function (t, done) {
        done();
    });

    this.it('baz2', { parallel: true }, function (t) {});

    //this.loop(['5', '6', '7'], (value) => {
    //
    //    this.it.only('makes stuff ' + value, t => {
    //
    //
    //    });
    //
    //});
    //
    //this.loop([8, 9, 10], (value) => {
    //
    //    this.it('makes stuff ' + value, (t /*done*/) => {
    //
    //    });
    //
    //});

    //this.runParallel(function () {
    //
    //
    //    this.it('makes stuff 8', t => {
    //
    //    }).it('makes stuff 9', t => {
    //
    //
    //    }).it('makes stuff 10', t => {
    //
    //
    //    });
    //
    //
    //});

    this.describe('suite five', {

        parallel: true

    }, function () {

        this.before(function () {}).after(function () {}).it.only('makes stuff 20', function (t, done) {

            setTimeout(function () {

                done();
            }, 10);
        });

        this.it('makes stuff 21', function () {}).it('makes stuff 22', function () {

            //console.log('this:',this);

        }).after(function () {});
    });

    this.describe('suite two', function () {

        this.describe('suite three', {

            parallel: true

        }, function () {

            this.before(function () {}).after(function () {});

            this.loop(['59', '69', '79'], function (value) {

                this.it('makes stuff ' + value, function () {});
            });

            this.it('makes stuff 16', function () {});

            this.it('makes stuff 17', function () {});
        });

        this.describe('suite four', function () {

            this.before(function (done) {
                done();
            }).beforeEach(function () {}).after(function () {}).it('makes stuff 18', function (t, done) {

                done();
            });

            this.it('makes stuff 19', function (t, done) {

                done();
            }).afterEach(function () {});
        });
    });
});